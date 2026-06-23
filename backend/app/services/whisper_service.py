import whisper

_model = None


def load_model() -> None:
    global _model
    print("[Whisper] Loading base model...")
    _model = whisper.load_model("base")
    print("[Whisper] Model loaded successfully.")


def get_model():
    global _model
    if _model is None:
        load_model()
    return _model


def transcribe_audio(file_path: str) -> str:
    model = get_model()
    result = model.transcribe(file_path, fp16=False)
    return result["text"].strip()
