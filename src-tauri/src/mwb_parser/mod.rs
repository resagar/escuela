mod types;
pub use types::*;

use lopdf::Document;
use regex::Regex;

const SPANISH_MONTHS: &[(&str, &str)] = &[
    ("ENERO", "01"),
    ("FEBRERO", "02"),
    ("MARZO", "03"),
    ("ABRIL", "04"),
    ("MAYO", "05"),
    ("JUNIO", "06"),
    ("JULIO", "07"),
    ("AGOSTO", "08"),
    ("SEPTIEMBRE", "09"),
    ("OCTUBRE", "10"),
    ("NOVIEMBRE", "11"),
    ("DICIEMBRE", "12"),
];

fn extract_text_from_pdf(path: &str) -> Result<String, String> {
    match extract_with_pdftotext(path) {
        Ok(t) => return Ok(t),
        Err(_) => {}
    }
    extract_with_lopdf(path)
}

fn extract_with_lopdf(path: &str) -> Result<String, String> {
    let doc = Document::load(path).map_err(|e| format!("Error al abrir PDF: {}", e))?;
    let pages: Vec<u32> = doc.get_pages().keys().copied().collect();
    if pages.is_empty() {
        return Err("El PDF no tiene páginas".to_string());
    }

    let text = doc.extract_text(&pages);

    match text {
        Ok(t) if t.trim().is_empty() => Err("Texto vacío".to_string()),
        Ok(t) => Ok(t),
        Err(_) => {
            let mut full_text = String::new();
            for &page_num in &pages {
                if let Ok(t) = doc.extract_text(&[page_num]) {
                    full_text.push_str(&t);
                    full_text.push('\n');
                }
            }
            if full_text.trim().is_empty() {
                Err("CMap error y page-by-page falló".to_string())
            } else {
                Ok(full_text)
            }
        }
    }
}

fn extract_with_pdftotext(path: &str) -> Result<String, String> {
    let output = std::process::Command::new("pdftotext")
        .arg(path)
        .arg("-")
        .output()
        .map_err(|e| format!("Error al ejecutar pdftotext: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("pdftotext falló: {}", stderr));
    }

    let text = String::from_utf8(output.stdout)
        .map_err(|e| format!("Error al decodificar texto: {}", e))?;

    if text.trim().is_empty() {
        Err("pdftotext no produjo texto".to_string())
    } else {
        Ok(text)
    }
}

fn normalize_text(raw: &str) -> String {
    let s = raw.replace("\r\n", "\n");
    let s = s.replace('\x05', "[SONG]");
    let s = s.replace('\x02', " ");
    let s = s.replace('\x03', " ");
    let s = s.replace('\x04', " ");
    let s = s.replace('\x0C', "\n\n");
    let re = Regex::new(r"\n{3,}").unwrap();
    let s = re.replace_all(&s, "\n\n").to_string();
    let re = Regex::new(r"[ \t]+").unwrap();
    let mut s = re.replace_all(&s, " ").to_string();

    let digit_space_re = Regex::new(r"(\d)[ \t]+(\d)").unwrap();
    loop {
        let after = digit_space_re.replace_all(&s, "$1$2").to_string();
        if after.len() == s.len() {
            break;
        }
        s = after;
    }
    s
}

fn parse_filename_year_month(path: &str) -> (i32, u32) {
    let re = Regex::new(r"(\d{4})(\d{2})").unwrap();
    if let Some(caps) = re.captures(path) {
        let year = caps[1].parse().unwrap_or(2026);
        let month = caps[2].parse().unwrap_or(1);
        (year, month)
    } else {
        (2026, 1)
    }
}

fn compact_spaces(text: &str) -> String {
    let mut result = String::with_capacity(text.len());
    let mut prev_was_space = false;
    for ch in text.chars() {
        if ch.is_whitespace() {
            if !prev_was_space {
                result.push(' ');
                prev_was_space = true;
            }
        } else {
            result.push(ch);
            prev_was_space = false;
        }
    }
    result.trim().to_string()
}

fn identify_month(month_text: &str) -> Option<&'static str> {
    let compact: String = month_text
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == 'Ñ' || *c == 'ñ' || *c == 'Í' || *c == 'Ó')
        .collect();
    let upper = compact.to_uppercase();
    for &(name, code) in SPANISH_MONTHS {
        if upper.contains(name) {
            return Some(code);
        }
    }
    for &(name, code) in SPANISH_MONTHS {
        let stripped: String = name.chars().filter(|c| *c != ' ').collect();
        if upper.contains(&stripped) {
            return Some(code);
        }
    }
    None
}

fn build_date(year: i32, month_code: &str, day: u32) -> String {
    format!("{:04}-{}-{:02}", year, month_code, day)
}

fn determine_month_for_week(
    month_name_code: &str,
    base_year: i32,
    base_month: u32,
) -> (i32, String) {
    let base_code = format!("{:02}", base_month);
    if month_name_code == base_code {
        return (base_year, month_name_code.to_string());
    }
    let next_month = if base_month == 12 {
        1
    } else {
        base_month + 1
    };
    let next_year = if base_month == 12 {
        base_year + 1
    } else {
        base_year
    };
    let next_code = format!("{:02}", next_month);
    if month_name_code == next_code {
        return (next_year, month_name_code.to_string());
    }
    (base_year, month_name_code.to_string())
}

// ─── Week header detection & parsing ───────────────────────────────

fn is_week_header_line(line: &str) -> bool {
    let trimmed = line.trim();
    if trimmed.is_empty() {
        return false;
    }

    // Reject numbered content lines like "8. Canción..." or "1. Busquemos perlas"
    if Regex::new(r"^\d+\.\s").unwrap().is_match(trimmed) {
        return false;
    }

    // Must start with a day number, optionally followed by dash and another number
    let re = Regex::new(r"^\d{1,2}(\s*[-–]\s*\d{1,2})?").unwrap();
    if !re.is_match(trimmed) {
        return false;
    }

    // Reject page numbers (single digit, nothing else)
    if Regex::new(r"^\d{1,2}$").unwrap().is_match(trimmed) {
        return false;
    }

    // Must contain a known month name (check for month fragments)
    let upper = trimmed.to_uppercase();
    let has_month = SPANISH_MONTHS.iter().any(|(name, _)| {
        let compact: String = name.chars().filter(|c| *c != ' ').collect();
        let line_no_spaces: String = upper.chars().filter(|c| *c != ' ').collect();
        line_no_spaces.contains(&compact)
    });

    has_month
}

#[derive(Debug)]
struct ParsedHeader {
    start_day: u32,
    end_day: u32,
    start_month_code: String,
    end_month_code: String,
    book_reference: String,
}

fn parse_week_header(header: &str) -> Result<ParsedHeader, String> {
    let clean = compact_spaces(header);
    let tokens: Vec<&str> = clean.split_whitespace().collect();

    if tokens.is_empty() {
        return Err("Header vacío".to_string());
    }

    let mut pos = 0;

    // Parse start day
    let start_day: u32 = tokens[pos]
        .parse()
        .map_err(|_| format!("Día inicial inválido: {}", tokens[pos]))?;
    pos += 1;

    let mut end_day = start_day;

    // Check for dash (date range)
    if pos < tokens.len() {
        if tokens[pos] == "-" || tokens[pos] == "–" {
            pos += 1;
            end_day = tokens[pos]
                .parse()
                .map_err(|_| format!("Día final inválido: {}", tokens[pos]))?;
            pos += 1;
        } else if tokens[pos].starts_with('-') {
            // Case: "9 -15" (dash attached to second number)
            end_day = tokens[pos][1..]
                .parse()
                .map_err(|_| format!("Día final inválido: {}", tokens[pos]))?;
            pos += 1;
        }
    }

    // Skip optional "D E" / "DE"
    if pos + 1 < tokens.len() && tokens[pos] == "D" && tokens[pos + 1] == "E" {
        pos += 2;
    } else if pos < tokens.len() && tokens[pos] == "DE" {
        pos += 1;
    }

    // Parse first month
    let (start_month_code, new_pos) = consume_month_tokens(&tokens, pos)?;
    pos = new_pos;

    let mut end_month_code = start_month_code.clone();

    // Check for cross-month pattern: "A 3 D E MAYO"
    if pos < tokens.len() && tokens[pos] == "A" {
        pos += 1; // skip "A"
        if pos < tokens.len() {
            end_day = tokens[pos]
                .parse()
                .map_err(|_| format!("Día final inválido: {}", tokens[pos]))?;
            pos += 1;
        }
        // Skip D E / DE
        if pos + 1 < tokens.len() && tokens[pos] == "D" && tokens[pos + 1] == "E" {
            pos += 2;
        } else if pos < tokens.len() && tokens[pos] == "DE" {
            pos += 1;
        }
        // Parse end month
        let (emc, new_pos) = consume_month_tokens(&tokens, pos)?;
        end_month_code = emc;
        pos = new_pos;
    }

    // The rest is the book reference
    let book_reference = normalize_book_reference(&tokens[pos..]);

    // A valid week header must have a book reference with at least one digit
    if !book_reference.chars().any(|c| c.is_ascii_digit()) {
        return Err("Header sin capítulo bíblico (falta referencia)".to_string());
    }

    Ok(ParsedHeader {
        start_day,
        end_day,
        start_month_code,
        end_month_code,
        book_reference,
    })
}

fn consume_month_tokens(tokens: &[&str], start: usize) -> Result<(String, usize), String> {
    if start >= tokens.len() {
        return Err("No hay tokens para mes".to_string());
    }

    // Collect consecutive alphabetic tokens
    let mut month_parts: Vec<&str> = Vec::new();
    let mut pos = start;

    while pos < tokens.len() && tokens[pos].chars().all(|c| c.is_alphabetic()) {
        month_parts.push(tokens[pos]);
        pos += 1;
    }

    if month_parts.is_empty() {
        return Err(format!(
            "Se esperaba nombre de mes en: {:?}",
            &tokens[start..]
        ));
    }

    // Try matching with progressively more tokens (concatenated)
    for i in 1..=month_parts.len() {
        let candidate = month_parts[..i].concat();
        if let Some(code) = identify_month(&candidate) {
            return Ok((code.to_string(), start + i));
        }
    }

    // Also try with spaces between parts
    for i in 1..=month_parts.len() {
        let candidate = month_parts[..i].join(" ");
        if let Some(code) = identify_month(&candidate) {
            return Ok((code.to_string(), start + i));
        }
    }

    Err(format!(
        "Mes no reconocido en tokens: {:?}",
        &tokens[start..pos]
    ))
}

fn normalize_book_reference(tokens: &[&str]) -> String {
    if tokens.is_empty() {
        return String::new();
    }

    // Collapse consecutive alphabetic tokens (e.g. "I SA ÍAS" → "ISAÍAS")
    let mut collapsed: Vec<String> = Vec::new();
    let mut i = 0;

    while i < tokens.len() {
        if tokens[i].chars().all(|c| c.is_alphabetic()) {
            let mut word = String::new();
            while i < tokens.len() && tokens[i].chars().all(|c| c.is_alphabetic()) {
                word.push_str(tokens[i]);
                i += 1;
            }
            collapsed.push(word);
        } else {
            collapsed.push(tokens[i].to_string());
            i += 1;
        }
    }

    // Clean punctuation spacing
    let joined = collapsed.join(" ");
    let re = Regex::new(r"\s+,\s*").unwrap();
    let result = re.replace_all(&joined, ", ").to_string();
    let re = Regex::new(r"\s+-\s*").unwrap();
    let result = re.replace_all(&result, "-").to_string();
    let re = Regex::new(r"\s+–\s*").unwrap();
    re.replace_all(&result, "–").to_string()
}

fn split_into_week_blocks(normalized: &str) -> Vec<(String, String)> {
    let mut blocks: Vec<(String, String)> = Vec::new();
    let mut current_header = String::new();
    let mut current_body = String::new();

    for line in normalized.lines() {
        if is_week_header_line(line) {
            // Save previous block if any
            if !current_header.is_empty() {
                blocks.push((current_header, current_body.trim().to_string()));
            }
            current_header = line.trim().to_string();
            current_body.clear();
        } else {
            if !current_body.is_empty() {
                current_body.push('\n');
            }
            current_body.push_str(line);
        }
    }

    // Save last block
    if !current_header.is_empty() {
        blocks.push((current_header, current_body.trim().to_string()));
    }

    blocks
}

fn parse_week_block(
    header: &str,
    body: &str,
    base_year: i32,
    base_month: u32,
) -> Result<ParsedWeek, String> {
    let parsed_header = parse_week_header(header)?;

    let (start_year, _) = determine_month_for_week(
        &parsed_header.start_month_code,
        base_year,
        base_month,
    );

    let fecha_inicio = build_date(
        start_year,
        &parsed_header.start_month_code,
        parsed_header.start_day,
    );

    let end_year = if parsed_header.end_month_code < parsed_header.start_month_code {
        start_year + 1
    } else {
        start_year
    };
    let fecha_fin = build_date(
        end_year,
        &parsed_header.end_month_code,
        parsed_header.end_day,
    );

    let libro_biblico = parsed_header.book_reference;

    let has_regular_structure = Regex::new(r"(?i)TESOROS\s+DE\s+LA\s+BIBLIA").unwrap().is_match(body)
        || Regex::new(r"(?i)SEAMOS\s+MEJORES\s+MAESTROS").unwrap().is_match(body)
        || Regex::new(r"(?i)NUESTRA\s+VIDA\s+CRISTIANA").unwrap().is_match(body);

    let is_asamblea = body.to_uppercase().contains("ASAMBLEA");
    let is_conmemoracion = body.to_uppercase().contains("CONMEMORACIÓN")
        || body.to_uppercase().contains("CONMEMORACIÓ")
        || body.to_uppercase().contains("CONMEMORACION");
    let is_visita = body.to_uppercase().contains("VISITA DEL SUPERINTENDENTE");

    let tipo_especial = if !has_regular_structure && (is_asamblea || is_conmemoracion) {
        if is_conmemoracion {
            TipoEspecial::Conmemoracion
        } else {
            TipoEspecial::Asamblea
        }
    } else if is_visita {
        TipoEspecial::VisitaSuperintendente
    } else {
        TipoEspecial::Normal
    };

    let (cancion_apertura, cancion_intermedia, cancion_cierre) = detect_songs(body);

    let partes = if tipo_especial == TipoEspecial::Asamblea
        || tipo_especial == TipoEspecial::Conmemoracion
    {
        Vec::new()
    } else {
        parse_parts(body)
    };

    Ok(ParsedWeek {
        fecha_inicio,
        fecha_fin,
        libro_biblico,
        cancion_apertura,
        cancion_intermedia,
        cancion_cierre,
        tipo_especial,
        partes,
    })
}

fn detect_songs(text: &str) -> (u8, u8, u8) {
    let song_re = Regex::new(r"(?:\[SONG\]|Canción|Cántico)\s*(\d+)").unwrap();

    // Collect (song_number, byte_position)
    let song_positions: Vec<(u8, usize)> = song_re
        .captures_iter(text)
        .filter_map(|c| {
            let num: u8 = c[1].parse().ok()?;
            Some((num, c.get(0).unwrap().start()))
        })
        .collect();

    let apertura = song_positions.first().map(|n| n.0).unwrap_or(0);
    let cierre = song_positions.last().map(|n| n.0).unwrap_or(0);

    // Find "NUESTRA VIDA CRISTIANA" section (handles line breaks with \s+)
    let vc_re = Regex::new(r"(?i)NUESTRA\s+VIDA\s+CRISTIANA").unwrap();
    let intermedia = if let Some(vc_match) = vc_re.find(text) {
        let vc_pos = vc_match.start();
        // First song AFTER the Vida Cristiana heading
        song_positions
            .iter()
            .find(|(_, pos)| *pos > vc_pos)
            .map(|n| n.0)
            .unwrap_or(0)
    } else {
        0
    };

    (apertura, intermedia, cierre)
}

fn parse_parts(text: &str) -> Vec<ParsedPart> {
    let lines: Vec<&str> = text.lines().collect();
    let mut parts: Vec<ParsedPart> = Vec::new();

    // ── Find introduction ──
    let intro_re = Regex::new(r"(?i)Palabras\s+de\s+introducci[óo]n").unwrap();
    let intro_min_re = Regex::new(r"\((\d+)\s*(?:min|mins?)\.?\)").unwrap();

    let mut has_intro = false;
    let mut has_conclusion = false;

    // ── Extract parts ──
    let mut i = 0;
    while i < lines.len() {
        let line = lines[i].trim();
        if line.is_empty() {
            i += 1;
            continue;
        }

        // Check for introduction
        if intro_re.is_match(line) {
            has_intro = true;
            let minutos = line_to_u8(&intro_min_re, line, 1);
            let (tipo, sala_aux, ayudante) = classify_part_type("Palabras de introducción", "marco");
            parts.push(ParsedPart {
                numero_orden: 0,
                seccion: "marco".to_string(),
                tipo_asignacion: tipo,
                titulo: "Palabras de introducción".to_string(),
                duracion_minutos: minutos,
                requiere_sala_auxiliar: sala_aux,
                requiere_ayudante: ayudante,
            });
            i += 1;
            continue;
        }

        // Check for conclusion
        if line.to_uppercase().contains("PALABRAS DE CONCLUSI") {
            has_conclusion = true;
            let minutos = line_to_u8(&intro_min_re, line, 3);
            let (tipo, sala_aux, ayudante) = classify_part_type("Palabras de conclusión", "marco");
            parts.push(ParsedPart {
                numero_orden: 99, // will be reassigned after sorting
                seccion: "marco".to_string(),
                tipo_asignacion: tipo,
                titulo: "Palabras de conclusión".to_string(),
                duracion_minutos: minutos,
                requiere_sala_auxiliar: sala_aux,
                requiere_ayudante: ayudante,
            });
            i += 1;
            continue;
        }

        // Match part numbers like "1.", "2.", "9."
        let part_start = Regex::new(r"^(\d{1,2})\.\s(.*)$").unwrap();
        if let Some(caps) = part_start.captures(line) {
            let numero_orden: u8 = caps[1].parse().unwrap_or(0);
            let first_part = caps[2].trim();
            let has_minute_on_same_line = intro_min_re.is_match(first_part);

            let mut title_parts: Vec<&str> = Vec::new();
            if !first_part.is_empty() {
                title_parts.push(first_part);
            }
            i += 1;

            // Only scan forward if the minute isn't already on this line
            if !has_minute_on_same_line {
                while i < lines.len() {
                    let next_line = lines[i].trim();
                    if next_line.is_empty() {
                        i += 1;
                        continue;
                    }
                    if Regex::new(r"^\d{1,2}\.\s").unwrap().is_match(next_line) {
                        break;
                    }
                    if Regex::new(r"(?i)^(TESOROS|SEAMOS|NUESTRA|VIDA\s+CRISTIANA)").unwrap().is_match(next_line) {
                        break;
                    }
                    if next_line.to_uppercase().contains("PALABRAS DE CONCLUSI") {
                        break;
                    }
                    if intro_min_re.is_match(next_line) {
                        i += 1;
                        break;
                    }
                    title_parts.push(next_line);
                    i += 1;
                }
            }

            let titulo = compact_spaces(&title_parts.join(" "));
            if titulo.is_empty() || titulo.contains("Palabras de introducci") {
                continue;
            }

            // Extract minutes and clean title
            let mut minutos: u8 = 0;
            let mut clean_title = titulo.clone();
            if let Some(m) = titre_min_capture(&titulo) {
                minutos = m;
                let re = Regex::new(r"\s*\(\d+\s*(?:min|mins?)\.?\)\s*").unwrap();
                clean_title = re.replace_all(&titulo, "").trim().to_string();
            } else if i > 0 && i <= lines.len() {
                let after_line = lines[i - 1].trim();
                if let Some(m) = line_to_u8_maybe(&intro_min_re, after_line) {
                    minutos = m;
                }
            }

            // Clean up trailing garbage (page numbers, underscores, etc.)
            let re_garbage = Regex::new(r"[\s_\-]{20,}.*$").unwrap();
            clean_title = re_garbage.replace(&clean_title, "").trim().to_string();

            // Remove trailing page numbers (standalone digits at end)
            let re_page = Regex::new(r"\s+\d{1,2}$").unwrap();
            clean_title = re_page.replace(&clean_title, "").trim().to_string();

            if clean_title.is_empty() {
                continue;
            }

            let tipo_str = classify_part_title(&clean_title);
            let seccion = classify_part_section(numero_orden, &clean_title, &tipo_str);

            let (tipo, sala_aux, ayudante) = classify_part_type(&clean_title, &seccion);

            parts.push(ParsedPart {
                numero_orden,
                seccion,
                tipo_asignacion: tipo,
                titulo: clean_title,
                duracion_minutos: minutos,
                requiere_sala_auxiliar: sala_aux,
                requiere_ayudante: ayudante,
            });
        } else {
            i += 1;
        }
    }

    // If no intro was found, add a default one
    if !has_intro {
        let (tipo, sala_aux, ayudante) = classify_part_type("Palabras de introducción", "marco");
        parts.push(ParsedPart {
            numero_orden: 0,
            seccion: "marco".to_string(),
            tipo_asignacion: tipo,
            titulo: "Palabras de introducción".to_string(),
            duracion_minutos: 1,
            requiere_sala_auxiliar: sala_aux,
            requiere_ayudante: ayudante,
        });
    }

    // If no conclusion, add a default one
    if !has_conclusion {
        let (tipo, sala_aux, ayudante) = classify_part_type("Palabras de conclusión", "marco");
        parts.push(ParsedPart {
            numero_orden: 255,
            seccion: "marco".to_string(),
            tipo_asignacion: tipo,
            titulo: "Palabras de conclusión".to_string(),
            duracion_minutos: 3,
            requiere_sala_auxiliar: sala_aux,
            requiere_ayudante: ayudante,
        });
    }

    // Sort by numero_orden (255 ensures conclusion stays at end)
    parts.sort_by_key(|p| p.numero_orden);

    // Fix intro/conclusion numero_orden
    for (i, p) in parts.iter_mut().enumerate() {
        if p.titulo == "Palabras de introducción" {
            p.numero_orden = 0;
        } else if p.titulo == "Palabras de conclusión" {
            p.numero_orden = i as u8;
        } else {
            p.numero_orden = i as u8;
        }
    }

    parts
}

fn titre_min_capture(title: &str) -> Option<u8> {
    let re = Regex::new(r"\((\d+)\s*(?:min|mins?)\.?\)").unwrap();
    re.captures(title)
        .and_then(|c| c[1].parse::<u8>().ok())
}

fn line_to_u8(re: &Regex, line: &str, default: u8) -> u8 {
    re.captures(line)
        .and_then(|c| c[1].parse::<u8>().ok())
        .unwrap_or(default)
}

fn line_to_u8_maybe(re: &Regex, line: &str) -> Option<u8> {
    re.captures(line)
        .and_then(|c| c[1].parse::<u8>().ok())
}

fn classify_part_title(title: &str) -> String {
    let upper = title.to_uppercase();
    if upper.contains("BUSQUEMOS PERLAS") {
        "busquemos_perlas".to_string()
    } else if upper.contains("LECTURA DE LA BIBLIA") {
        "lectura_biblia".to_string()
    } else if upper.contains("EMPIECE CONVERSACIONES") {
        "empiece_conversaciones".to_string()
    } else if upper.contains("HAGA REVISITAS") {
        "haga_revisitas".to_string()
    } else if upper.contains("HAGA DISCÍPULOS") || upper.contains("HAGA DISCIPULOS") {
        "haga_discipulos".to_string()
    } else if upper.contains("EXPLIQUE SUS CREENCIAS") {
        "explique_creencias".to_string()
    } else if upper.contains("NECESIDADES DE LA CONGREGACIÓN")
        || upper.contains("NECESIDADES DE LA CONGREGACION")
    {
        "necesidades_congregacion".to_string()
    } else if upper.contains("ESTUDIO BÍBLICO DE LA CONGREGACIÓN")
        || upper.contains("ESTUDIO BIBLICO DE LA CONGREGACION")
    {
        "estudio_biblico".to_string()
    } else if upper.contains("HAZTE AMIGO DE JEHOVÁ") {
        "hazte_amigo".to_string()
    } else if upper.contains("LOGROS DE LA ORGANIZACIÓN") {
        "logros_organizacion".to_string()
    } else if upper.contains("DISCURSO") {
        "discurso".to_string()
    } else {
        "discurso_no_estudiante".to_string()
    }
}

fn classify_part_section(numero_orden: u8, title: &str, tipo: &str) -> String {
    // Rules 1-3 are always tesoros
    if numero_orden <= 3 {
        return "tesoros".to_string();
    }

    // Known tesoros types
    if tipo == "busquemos_perlas" || tipo == "lectura_biblia" {
        return "tesoros".to_string();
    }

    // Known mejores_maestros types
    if tipo == "empiece_conversaciones"
        || tipo == "haga_revisitas"
        || tipo == "haga_discipulos"
        || tipo == "explique_creencias"
    {
        return "mejores_maestros".to_string();
    }

    // Known vida_cristiana types
    if tipo == "necesidades_congregacion"
        || tipo == "estudio_biblico"
        || tipo == "hazte_amigo"
        || tipo == "logros_organizacion"
    {
        return "vida_cristiana".to_string();
    }

    // Title-based heuristics
    let upper = title.to_uppercase();
    if upper.contains("ANÁLISIS CON EL AUDITORIO")
        || upper.contains("ANALISIS CON EL AUDITORIO")
        || upper.contains("QUE NINGÚN")
        || upper.contains("NUNCA DEJE")
        || upper.contains("APROVECHE")
    {
        return "vida_cristiana".to_string();
    }

    // Discurso in the 7 slot
    if numero_orden == 7 && tipo.contains("discurso") {
        return "mejores_maestros".to_string();
    }

    // Default: if it has a student assignment feel, it's mejores_maestros
    if numero_orden >= 4 && numero_orden <= 6 {
        return "mejores_maestros".to_string();
    }

    if numero_orden >= 7 && numero_orden <= 9 {
        return "vida_cristiana".to_string();
    }

    "tesoros".to_string()
}

fn classify_part_type(titulo: &str, seccion: &str) -> (String, bool, bool) {
    let upper = titulo.to_uppercase();

    if upper.contains("BUSQUEMOS PERLAS") {
        return ("busquemos_perlas".to_string(), false, false);
    }
    if upper.contains("LECTURA DE LA BIBLIA") {
        return ("lectura_biblia".to_string(), true, false);
    }
    if upper.contains("EMPIECE CONVERSACIONES") {
        return ("empiece_conversaciones".to_string(), true, true);
    }
    if upper.contains("HAGA REVISITAS") {
        return ("haga_revisitas".to_string(), true, true);
    }
    if upper.contains("HAGA DISCÍPULOS") || upper.contains("HAGA DISCIPULOS") {
        return ("haga_discipulos".to_string(), true, true);
    }
    if upper.contains("EXPLIQUE SUS CREENCIAS") {
        if upper.contains("DISCURSO") {
            return ("explique_creencias_discurso".to_string(), true, false);
        }
        return (
            "explique_creencias_escenificacion".to_string(),
            true,
            true,
        );
    }
    if upper.contains("ANÁLISIS CON EL AUDITORIO")
        || upper.contains("ANALISIS CON EL AUDITORIO")
    {
        return ("analisis_auditorio".to_string(), false, false);
    }
    if upper.contains("NECESIDADES DE LA CONGREGACIÓN")
        || upper.contains("NECESIDADES DE LA CONGREGACION")
    {
        return ("necesidades_congregacion".to_string(), false, false);
    }
    if upper.contains("ESTUDIO BÍBLICO") || upper.contains("ESTUDIO BIBLICO") {
        return ("estudio_biblico".to_string(), false, false);
    }
    if upper.contains("PALABRAS DE INTRODUCCI") {
        return ("introduccion".to_string(), false, false);
    }
    if upper.contains("PALABRAS DE CONCLUSI") {
        return ("conclusion".to_string(), false, false);
    }

    if upper.contains("DISCURSO") {
        if seccion == "mejores_maestros" {
            return ("discurso_estudiante".to_string(), true, false);
        }
        return ("discurso_no_estudiante".to_string(), false, false);
    }

    match seccion {
        "tesoros" => ("discurso_no_estudiante".to_string(), false, false),
        "mejores_maestros" => ("discurso_estudiante".to_string(), true, false),
        "vida_cristiana" => ("discurso_no_estudiante".to_string(), false, false),
        _ => ("discurso_no_estudiante".to_string(), false, false),
    }
}

pub fn parse_mwb_pdf(path: &str) -> Result<Vec<ParsedWeek>, String> {
    let (year, base_month) = parse_filename_year_month(path);
    let raw_text = extract_text_from_pdf(path)?;
    let normalized = normalize_text(&raw_text);
    parse_weeks_from_normalized(&normalized, year, base_month)
}

/// Exposed for testing — parses pre-normalized text directly
pub fn test_parse_raw(normalized: &str) -> Result<Vec<ParsedWeek>, String> {
    parse_weeks_from_normalized(normalized, 2026, 3)
}

fn parse_weeks_from_normalized(normalized: &str, year: i32, base_month: u32) -> Result<Vec<ParsedWeek>, String> {
    let week_blocks = split_into_week_blocks(normalized);

    if week_blocks.is_empty() {
        return Err("No se detectaron semanas en el PDF".to_string());
    }

    let mut weeks = Vec::new();

    for (_i, (header, body)) in week_blocks.iter().enumerate() {
        match parse_week_block(header, body, year, base_month) {
            Ok(week) => {
                weeks.push(week);
            }
            Err(_e) => {
                // Skip false positives (lines that look like headers but aren't valid weeks)
            }
        }
    }

    if weeks.is_empty() {
        return Err("Ninguna semana válida detectada en el PDF".to_string());
    }

    Ok(weeks)
}
