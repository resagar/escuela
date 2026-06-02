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

    // Must contain alphabetic characters (month names)
    let has_letters = trimmed.chars().any(|c| c.is_alphabetic());

    // Must not look like a regular content line (parts, sections, etc.)
    let looks_like_content =
        trimmed.contains("min") || trimmed.contains("(") || trimmed.contains(")");

    has_letters && !looks_like_content
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

    let is_asamblea = body.to_uppercase().contains("ASAMBLEA");
    let is_conmemoracion = body.to_uppercase().contains("CONMEMORACIÓN")
        || body.to_uppercase().contains("CONMEMORACIÓ")
        || body.to_uppercase().contains("CONMEMORACION");
    let is_visita = body.to_uppercase().contains("VISITA DEL SUPERINTENDENTE");

    let tipo_especial = if is_asamblea || is_conmemoracion {
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

fn clean_book_name(raw: &str) -> String {
    let s = raw.trim();
    let re = Regex::new(r"\s+").unwrap();
    let s = re.replace_all(s, " ").to_string();
    let s = s
        .chars()
        .filter(|&c| c.is_alphanumeric() || c == ' ' || c == ',' || c == '.' || c == ';')
        .collect::<String>();
    let re = Regex::new(r"\s*,\s*").unwrap();
    re.replace_all(&s, ", ").to_string()
}

fn detect_songs(text: &str) -> (u8, u8, u8) {
    let song_re = Regex::new(r"(?:\[SONG\]|Canción|Cántico)\s*(\d+)").unwrap();
    let song_nums: Vec<u8> = song_re
        .captures_iter(text)
        .filter_map(|c| c[1].parse().ok())
        .collect();

    let apertura = *song_nums.first().unwrap_or(&0);
    let cierre = *song_nums.last().unwrap_or(&0);

    let vida_cristiana_pos = text.to_uppercase().find("NUESTRA VIDA CRISTIANA");
    let intermedia = if let Some(pos) = vida_cristiana_pos {
        let before_vc = &text[..pos];
        let songs_before_vc: Vec<u8> = song_re
            .captures_iter(before_vc)
            .filter_map(|c| c[1].parse().ok())
            .collect();
        *songs_before_vc.last().unwrap_or(&0)
    } else {
        0
    };

    (apertura, intermedia, cierre)
}

fn parse_parts(text: &str) -> Vec<ParsedPart> {
    let mut current_section = "tesoros".to_string();
    let mut parts: Vec<ParsedPart> = Vec::new();

    let section_re =
        Regex::new(r"(?i)TESOROS\s+DE\s+LA\s+BIBLIA|SEAMOS\s+MEJORES\s+MAESTROS|NUESTRA\s+VIDA\s+CRISTIANA")
            .unwrap();
    let part_re =
        Regex::new(r"(\d+)\.\s+(.+?)\s+\((\d+)\s*(?:min|mins?)\.?\s*\)")
            .unwrap();

    for sec_match in section_re.find_iter(text) {
        let sec_upper = sec_match.as_str().to_uppercase();
        if sec_upper.contains("TESOROS") {
            current_section = "tesoros".to_string();
        } else if sec_upper.contains("SEAMOS") {
            current_section = "mejores_maestros".to_string();
        } else if sec_upper.contains("NUESTRA") {
            current_section = "vida_cristiana".to_string();
        }
    }

    let special_intro_re = Regex::new(r"(?i)Palabras\s+de\s+introducci[óo]n\s*\((\d+)\s*(?:min|mins?)\.?\s*\)")
        .unwrap();
    let special_concl_re = Regex::new(r"(?i)Palabras\s+de\s+conclusi[óo]n\s*\((\d+)\s*(?:min|mins?)\.?\s*\)")
        .unwrap();

    let mut seen_contexts: Vec<(usize, usize, &str)> = Vec::new();
    for m in section_re.find_iter(text) {
        let sec_upper = m.as_str().to_uppercase();
        let ctx = if sec_upper.contains("TESOROS") {
            "tesoros"
        } else if sec_upper.contains("SEAMOS") {
            "mejores_maestros"
        } else {
            "vida_cristiana"
        };
        seen_contexts.push((m.start(), m.end(), ctx));
    }

    let mut part_order: u8 = 0;

    if let Some(intro_cap) = special_intro_re.captures(text) {
        let minutos: u8 = intro_cap[1].parse().unwrap_or(1);
        let (tipo, sala_aux, ayudante) =
            classify_part_type("Palabras de introducción", "marco");
        part_order += 1;
        parts.push(ParsedPart {
            numero_orden: part_order,
            seccion: "marco".to_string(),
            tipo_asignacion: tipo,
            titulo: "Palabras de introducción".to_string(),
            duracion_minutos: minutos,
            requiere_sala_auxiliar: sala_aux,
            requiere_ayudante: ayudante,
        });
    }

    for cap in part_re.captures_iter(text) {
        let full_start = cap.get(0).unwrap().start();

        let mut section_for_part = current_section.clone();
        for &(_ctx_start, ctx_end, ctx) in seen_contexts.iter().rev() {
            if ctx_end <= full_start {
                section_for_part = ctx.to_string();
                break;
            }
        }

        let order: u8 = cap[1].parse().unwrap_or(0);
        let titulo_raw = cap[2].trim();
        let minutos: u8 = cap[3].parse().unwrap_or(0);

        let (tipo, sala_aux, ayudante) = if titulo_raw.to_uppercase().contains("PALABRAS DE INTRODUCCI") {
            continue;
        } else if titulo_raw.to_uppercase().contains("PALABRAS DE CONCLUSI") {
            continue;
        } else {
            classify_part_type(titulo_raw, &section_for_part)
        };

        part_order = order.max(part_order + 1);
        parts.push(ParsedPart {
            numero_orden: order,
            seccion: section_for_part,
            tipo_asignacion: tipo,
            titulo: titulo_raw.to_string(),
            duracion_minutos: minutos,
            requiere_sala_auxiliar: sala_aux,
            requiere_ayudante: ayudante,
        });
    }

    if let Some(concl_cap) = special_concl_re.captures(text) {
        let minutos: u8 = concl_cap[1].parse().unwrap_or(3);
        let (tipo, sala_aux, ayudante) =
            classify_part_type("Palabras de conclusión", "marco");
        part_order += 1;
        parts.push(ParsedPart {
            numero_orden: part_order,
            seccion: "marco".to_string(),
            tipo_asignacion: tipo,
            titulo: "Palabras de conclusión".to_string(),
            duracion_minutos: minutos,
            requiere_sala_auxiliar: sala_aux,
            requiere_ayudante: ayudante,
        });
    }

    parts
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

    for (i, (header, body)) in week_blocks.iter().enumerate() {
        match parse_week_block(header, body, year, base_month) {
            Ok(week) => {
                weeks.push(week);
            }
            Err(e) => {
                return Err(format!("Error en semana {}: {}", i + 1, e));
            }
        }
    }

    Ok(weeks)
}
