import html2canvas from "html2canvas";
import { save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

export async function downloadS140AsJpeg(
	element: HTMLElement,
	filename: string,
): Promise<void> {
	const wrapper = document.createElement("div");
	wrapper.style.backgroundColor = "#ffffff";
	wrapper.style.padding = "24px";
	wrapper.style.display = "inline-block";
	const clone = element.cloneNode(true) as HTMLElement;
	wrapper.appendChild(clone);
	document.body.appendChild(wrapper);

	const canvas = await html2canvas(wrapper, {
		scale: 2,
		useCORS: true,
		backgroundColor: "#ffffff",
		logging: false,
	});

	document.body.removeChild(wrapper);

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
