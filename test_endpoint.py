"""Test endpoint for PR testing demonstration."""


def hello():
    """Return a simple greeting."""
    return {"message": "Hello from test PR!", "status": "ok"}


if __name__ == "__main__":
    print(hello())
