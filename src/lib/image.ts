import type { ImageInput } from "@/lib/types"

export const MAX_FILE_BYTES = 10 * 1024 * 1024
const ACCEPTED = /^image\/(jpeg|jpg|png|webp|heic|heif)$/i

export class ImageError extends Error {}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new ImageError("decode"))
    img.src = src
  })
}

function drawScaled(img: CanvasImageSource, w: number, h: number, maxEdge: number, quality: number) {
  const scale = Math.min(1, maxEdge / Math.max(w, h))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(w * scale))
  canvas.height = Math.max(1, Math.round(h * scale))
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#fff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL("image/jpeg", quality)
}

/** Validates, resizes to max 1024px (JPEG ~0.8) and makes a 200px thumbnail. */
export async function prepareImageFile(file: File): Promise<ImageInput> {
  const isHeicName = /\.(heic|heif)$/i.test(file.name)
  if (!(ACCEPTED.test(file.type) || isHeicName)) {
    throw new ImageError("That doesn't look like a photo. Please pick a JPG, PNG, WEBP or HEIC image.")
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new ImageError("That photo is over 10 MB. Please pick a smaller one.")
  }
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url).catch(() => {
      throw new ImageError(
        isHeicName || /hei[cf]/i.test(file.type)
          ? "This browser can't open HEIC photos. Please use JPG or PNG, or take the photo with the camera button."
          : "Couldn't read that image. Please try another photo."
      )
    })
    return fromSource(img, img.naturalWidth, img.naturalHeight)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** For frames captured from a live <video> preview. */
export function prepareFromVideo(video: HTMLVideoElement): ImageInput {
  return fromSource(video, video.videoWidth, video.videoHeight)
}

function fromSource(src: CanvasImageSource, w: number, h: number): ImageInput {
  return {
    dataUrl: drawScaled(src, w, h, 1024, 0.8),
    thumbnail: drawScaled(src, w, h, 200, 0.7),
  }
}

export function dataUrlToInline(dataUrl: string) {
  const [meta, data] = dataUrl.split(",")
  const mimeType = meta.match(/data:(.*?);/)?.[1] ?? "image/jpeg"
  return { mimeType, data }
}
