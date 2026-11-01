import { useEffect, type ReactNode } from "react";

interface ModalProps {
	open: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
	useEffect(() => {
		if (!open) return;
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handleKey);
		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", handleKey);
			document.body.style.overflow = originalOverflow;
		};
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-label={title}
				className="bg-ui-surface rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col"
			>
				<div className="flex items-center justify-between px-4 py-3 border-b border-ui-divider">
					<h2 className="text-sm font-bold text-ui-text">{title}</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-ui-muted hover:text-ui-text text-2xl leading-none px-2"
						aria-label="Cerrar"
					>
						×
					</button>
				</div>
				<div className="overflow-y-auto overscroll-contain px-4 py-3">
				{children}
			</div>
			</div>
		</div>
	);
}
