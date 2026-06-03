import html2canvas from "html2canvas";
import { save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

export async function downloadS140AsJpeg(
	element: HTMLElement,
	filename: string,
): Promise<void> {
	const canvas = await html2canvas(element, {
		scale: 2,
		useCORS: true,
		backgroundColor: "#ffffff",
		logging: false,
	});

	const blob = await new Promise<Blob>((resolve) => {
		canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.95);
	});

	const buffer = await blob.arrayBuffer();
	const data = Array.from(new Uint8Array(buffer));

	const filePath = await save({
		defaultPath: filename,
		filters: [{ name: "JPEG", extensions: ["jpg"] }],
	});

	if (filePath) {
		await invoke("write_file_bytes", { path: filePath, data });
	}
}
