use escuela_lib::mwb_parser;
use std::process::Command;

#[test]
fn test_parse_real_pdf() {
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let pdf_path = format!("{}/../refs/mwb_S_202609 (1).pdf", manifest_dir);
    let result = mwb_parser::parse_mwb_pdf(&pdf_path);
    if let Err(ref e) = result {
        let output = Command::new("pdftotext")
            .arg("-layout")
            .arg(&pdf_path)
            .arg("-")
            .output()
            .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
            .unwrap_or_default();
        eprintln!("=== RAW PDFTOTEXT OUTPUT (first 200 bytes) ===");
        for (i, b) in output.bytes().enumerate().take(200) {
            if i > 0 && i % 40 == 0 { eprintln!(); }
            eprint!("{:02x} ", b);
        }
        eprintln!();
    }
    assert!(result.is_ok(), "Parser failed: {:?}", result.err());
    let weeks = result.unwrap();
    assert!(!weeks.is_empty(), "No weeks parsed");
    assert!(weeks.len() >= 6, "Expected >=6 weeks, got {}", weeks.len());

    for (i, w) in weeks.iter().enumerate() {
        println!("\n--- Week {} ---", i + 1);
        println!("  Dates: {} to {}", w.fecha_inicio, w.fecha_fin);
        println!("  Book: {}", w.libro_biblico);
        println!("  Type: {:?}", w.tipo_especial);
        println!("  Songs: {} / {} / {}", w.cancion_apertura, w.cancion_intermedia, w.cancion_cierre);
        for (_j, p) in w.partes.iter().enumerate() {
            println!("    {}. [{}] {} ({}) - {}min",
                p.numero_orden, p.seccion, p.titulo, p.tipo_asignacion, p.duracion_minutos);
        }
    }
}

#[test]
fn test_parse_simple_header() {
    // Simulate a week header as it appears after normalize_text
    let text = "\n2 - 8 D E MARZO I SA ÍAS 41, 42\n\ncanción content\n\n9 - 15 D E MARZO I SA ÍAS 43, 44\n";
    let result = escuela_lib::mwb_parser::test_parse_raw(text);
    assert!(result.is_ok(), "Simple header parse failed: {:?}", result.err());
    let weeks = result.unwrap();
    assert_eq!(weeks.len(), 2, "Expected 2 weeks");
    assert_eq!(weeks[0].fecha_inicio, "2026-03-02");
    assert_eq!(weeks[0].libro_biblico, "ISAÍAS 41, 42");
}

#[test]
fn test_parse_header_with_attached_range() {
    // First week of the Sep-Oct 2026 guide: "7-13" (dash attached, no spaces)
    let text = "\n7-13 D E SEPTI EMB RE J E R E M ÍAS 32 , 33\n\n\
1. Meditar en las cualidades de Jehová fortalece nuestra fe (10 mins.)\n";
    let result = escuela_lib::mwb_parser::test_parse_raw(text);
    assert!(result.is_ok(), "Attached range parse failed: {:?}", result.err());
    let weeks = result.unwrap();
    assert_eq!(weeks.len(), 1, "Expected 1 week");
    assert_eq!(weeks[0].fecha_inicio, "2026-09-07");
    assert_eq!(weeks[0].fecha_fin, "2026-09-13");
    assert_eq!(weeks[0].libro_biblico, "JEREMÍAS 32, 33");
}

#[test]
fn test_parse_que_dirias() {
    let text = "\n2 - 8 D E MARZO I SA ÍAS 41, 42\n\n\
1. Tesoros\n\n\
SEAMOS MEJORES MAESTROS\n\n\
4. ¿Qué dirías? (5 min.)\n\n\
5. ¿Qué diría? (6 min.)\n\n\
6. Empiece conversaciones (4 min.)\n";
    let result = escuela_lib::mwb_parser::test_parse_raw(text);
    assert!(result.is_ok(), "Que dirias parse failed: {:?}", result.err());
    let weeks = result.unwrap();
    let que_dirias: Vec<_> = weeks[0]
        .partes
        .iter()
        .filter(|p| p.tipo_asignacion == "que_dirias")
        .collect();
    assert_eq!(que_dirias.len(), 2, "Expected 2 que_dirias parts");
    for p in que_dirias {
        assert_eq!(p.seccion, "mejores_maestros");
        assert_eq!(p.requiere_sala_auxiliar, false);
        assert_eq!(p.requiere_ayudante, false);
    }
}

#[test]
fn test_parse_que_dirias_with_suffix_is_analisis() {
    // Mirrors the real 21-sep week: the "¿Qué diría?" with the "Análisis con
    // el auditorio" suffix belongs to "Seamos mejores maestros"; only the part
    // after "NUESTRA VIDA CRISTIANA" starts the Vida Cristiana section.
    let text = "\n2 - 8 D E MARZO I SA ÍAS 41, 42\n\n\
SEAMOS MEJORES MAESTROS\n\n\
6. ¿Qué diría? (6 mins.) Análisis con el auditorio.\n\n\
NUESTRA\n\n\
VIDA CRISTIANA\n\n\
7. Seamos siempre neutrales (15 mins.) Análisis con el auditorio.\n";
    let result = escuela_lib::mwb_parser::test_parse_raw(text);
    assert!(result.is_ok(), "Suffix parse failed: {:?}", result.err());
    let weeks = result.unwrap();
    let analisis = weeks[0]
        .partes
        .iter()
        .find(|p| p.tipo_asignacion == "analisis_auditorio")
        .expect("analisis_auditorio part not found");
    assert_eq!(analisis.requiere_sala_auxiliar, false);
    assert_eq!(analisis.requiere_ayudante, false);
    assert_eq!(
        analisis.seccion, "mejores_maestros",
        "análisis de ¿Qué diría? should belong to mejores_maestros when under SEAMOS MEJORES MAESTROS"
    );
}

#[test]
fn test_first_vida_cristiana_part_stays_vida_when_few_students() {
    // Week with only two student assignments in "Seamos mejores maestros", so
    // the first "Nuestra vida cristiana" part lands on position 6. It must be
    // classified as vida_cristiana thanks to the explicit section header,
    // regardless of the positional heuristic.
    let text = "\n2 - 8 D E MARZO I SA ÍAS 41, 42\n\n\
SEAMOS MEJORES MAESTROS\n\n\
4. Empiece conversaciones (4 min.)\n\n\
5. ¿Qué diría? (5 min.)\n\n\
NUESTRA VIDA CRISTIANA\n\n\
6. Análisis con el auditorio (5 min.)\n";
    let result = escuela_lib::mwb_parser::test_parse_raw(text);
    assert!(result.is_ok(), "Few-student week parse failed: {:?}", result.err());
    let weeks = result.unwrap();
    let analisis = weeks[0]
        .partes
        .iter()
        .find(|p| p.tipo_asignacion == "analisis_auditorio")
        .expect("analisis_auditorio part not found");
    assert_eq!(
        analisis.seccion, "vida_cristiana",
        "first vida cristiana part must stay vida_cristiana even in low positions"
    );
}

#[test]
fn test_real_pdf_sep21_sections() {
    // Week 21-27 SEP (21 de septiembre): the "¿Qué diría?" with the "Análisis
    // con el auditorio" suffix must be mejores_maestros, while "Seamos siempre
    // neutrales..." (after "NUESTRA VIDA CRISTIANA") must be vida_cristiana.
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let pdf_path = format!("{}/../refs/mwb_S_202609 (1).pdf", manifest_dir);
    let weeks =
        mwb_parser::parse_mwb_pdf(&pdf_path).expect("real PDF should parse");
    let sep21 = weeks
        .iter()
        .find(|w| w.fecha_inicio == "2026-09-21")
        .expect("week 2026-09-21 not found");

    let que_diria = sep21
        .partes
        .iter()
        .find(|p| p.titulo.starts_with("¿Qué diría?") && p.tipo_asignacion == "analisis_auditorio")
        .expect("¿Qué diría? with análisis not found");
    assert_eq!(
        que_diria.seccion, "mejores_maestros",
        "¿Qué diría? must stay in mejores_maestros"
    );

    let primera_vida = sep21
        .partes
        .iter()
        .find(|p| p.titulo.contains("Seamos siempre neutrales"))
        .expect("Seamos siempre neutrales not found");
    assert_eq!(
        primera_vida.seccion, "vida_cristiana",
        "first vida cristiana part must be vida_cristiana"
    );

    let busquemos = sep21
        .partes
        .iter()
        .find(|p| p.tipo_asignacion == "busquemos_perlas")
        .expect("busquemos perlas not found");
    assert_eq!(busquemos.seccion, "tesoros");

    // Songs for the 21-sep week: 74 / 142 / 134 (intermediate must be found
    // even though the "VIDA CRISTIANA" header arrives fragmented with [SONG]).
    assert_eq!(sep21.cancion_apertura, 74, "unexpected opening song");
    assert_eq!(sep21.cancion_intermedia, 142, "unexpected intermediate song");
    assert_eq!(sep21.cancion_cierre, 134, "unexpected closing song");
}

#[test]
fn test_songs_with_fragmented_vida_header() {
    // Reproduces the real extraction where the intermediate song icon ([SONG])
    // breaks the "NUESTRA VIDA CRISTIANA" header into separate lines.
    let text = "\n2 - 8 D E MARZO I SA ÍAS 41, 42\n\n\
Canción 5 y oración Palabras de introducción\n\n\
1. Meditar en las cualidades de Jehová (10 mins.)\n\n\
NUESTRA\n\n\
[SONG]\n\n\
VIDA CRISTIANA\n\n\
Canción 121\n\n\
7. Seamos siempre neutrales (15 mins.)\n\n\
Palabras de conclusión (3 mins.)\n\n\
Canción 98 y oración\n";
    let result = escuela_lib::mwb_parser::test_parse_raw(text);
    assert!(result.is_ok(), "Song parse failed: {:?}", result.err());
    let weeks = result.unwrap();
    let week = &weeks[0];
    assert_eq!(week.cancion_apertura, 5, "opening song");
    assert_eq!(week.cancion_intermedia, 121, "intermediate song");
    assert_eq!(week.cancion_cierre, 98, "closing song");
}
