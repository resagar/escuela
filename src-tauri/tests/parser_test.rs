use escuela_lib::mwb_parser;
use std::process::Command;

#[test]
fn test_parse_real_pdf() {
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let pdf_path = format!("{}/../refs/mwb_S_202603.pdf", manifest_dir);
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
