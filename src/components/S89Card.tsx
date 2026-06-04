interface S89CardProps {
	estudianteNombre: string;
	ayudanteNombre: string | null;
	fechaFormateada: string;
	numeroOrden: number;
	ambito: string;
}

export default function S89Card({
	estudianteNombre,
	ayudanteNombre,
	fechaFormateada,
	numeroOrden,
	ambito,
}: S89CardProps) {
	const isPrincipal = ambito === "auditorio_principal";

	return (
		<div className="s89-card">
			<div>
				<div className="s89-header">
					<h1>
						Asignación para la reunión
						<br />
						Vida y Ministerio Cristianos
					</h1>
				</div>

				<div className="s89-fields">
					<div className="s89-field">
						<span className="s89-label">Nombre:</span>
						<span className="s89-value">{estudianteNombre}</span>
					</div>
					<div className="s89-field">
						<span className="s89-label">Ayudante:</span>
						<span className="s89-value">{ayudanteNombre ?? ""}</span>
					</div>
					<div className="s89-field">
						<span className="s89-label">Fecha:</span>
						<span className="s89-value">{fechaFormateada}</span>
					</div>
					<div className="s89-field">
						<span className="s89-label">Intervención núm.:</span>
						<span className="s89-value">{numeroOrden}</span>
					</div>
				</div>

				<div className="s89-location-section">
					<div className="s89-location-title">Se presentará en:</div>
					<div className="s89-checkboxes">
						<div className="s89-checkbox-row">
							<span className="s89-box">{isPrincipal ? "X" : ""}</span>
							<span className="s89-checkbox-label">Sala principal</span>
						</div>
						<div className="s89-checkbox-row">
							<span className="s89-box">{!isPrincipal ? "X" : ""}</span>
							<span className="s89-checkbox-label">Sala auxiliar núm. 1</span>
						</div>
						<div className="s89-checkbox-row">
							<span className="s89-box"></span>
							<span className="s89-checkbox-label">Sala auxiliar núm. 2</span>
						</div>
					</div>
				</div>
			</div>

			<div>
				<div className="s89-note">
					<span className="s89-note-title">Nota al estudiante:</span> En la
					{" "}<span className="s89-publication">Guía de actividades</span> encontrará la información
					que necesita para su intervención. Repase también las indicaciones que se describen
					en las{" "}
					<span className="s89-publication">Instrucciones para la reunión Vida y Ministerio Cristianos (S-38)</span>.
				</div>
				<div className="s89-footer">
					<span className="s89-code">S-89-S 11/23</span>
				</div>
			</div>
		</div>
	);
}
