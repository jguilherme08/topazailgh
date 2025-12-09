import io
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import Response
from PIL import Image
import numpy as np
import cv2

app = FastAPI()

@app.post("/api/enhance")
async def enhance(
    file: UploadFile = File(...),
    upscale: int = Form(1),
    denoise: bool = Form(False),
    face_restore: bool = Form(False)
):
    # Carregar imagem
    image = Image.open(io.BytesIO(await file.read())).convert("RGB")
    img_np = np.array(image)

    # Denoise neural (dummy)
    if denoise:
        img_np = cv2.fastNlMeansDenoisingColored(img_np, None, 10, 10, 7, 21)

    # Deblur (dummy, placeholder)
    # (Aqui você pode inserir um filtro de deblur se desejar)

    # Upscale 2x (dummy, placeholder)
    if upscale == 2:
        img_np = cv2.resize(img_np, (img_np.shape[1]*2, img_np.shape[0]*2), interpolation=cv2.INTER_CUBIC)

    # Face restore (dummy, placeholder)
    if face_restore:
        pass  # Aqui entraria o modelo de restauração facial

    # Sharpen final leve
    kernel = np.array([[0, -1, 0], [-1, 5,-1], [0, -1, 0]])
    img_np = cv2.filter2D(img_np, -1, kernel)

    # Converter de volta para imagem
    out_img = Image.fromarray(np.clip(img_np, 0, 255).astype(np.uint8))
    buf = io.BytesIO()
    out_img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")
