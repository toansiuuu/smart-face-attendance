FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src ./src
COPY service.py identity.py ./
COPY models/detector_quantized.onnx models/best_model_quantized.onnx models/face_recognition_sface_2021dec.onnx models/SFACE-LICENSE ./models/
EXPOSE 8001
CMD ["python", "-m", "uvicorn", "service:app", "--host", "0.0.0.0", "--port", "8001", "--limit-concurrency", "8"]
