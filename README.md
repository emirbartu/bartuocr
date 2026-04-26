
Personal fork of [ScreenOCR](https://www.raycast.com/huzef44/screenocr)

The built-in Raycast screen OCR extension, but heavily modded for my daily math-heavy workflow.

## What's different from upstream

**Multi-engine support.** The original only uses Apple VisionKit. This fork lets you pick from 6 OCR engines:

| Engine | Type | Good for |
|--------|------|----------|
| Apple VisionKit | Built-in | Fast text, 17 languages, no setup |
| Tesseract | CLI (`brew install tesseract`) | Text, 100+ languages |
| PaddleOCR | Python via `uvx` | Text + formula → LaTeX |
| GLM-OCR | Ollama (`ollama pull glm-ocr`) | Text + formula → LaTeX |
| DeepSeek-OCR | Ollama (`ollama pull deepseek-ocr`) | Text + formula → LaTeX |
| LaTeX-OCR / pix2tex | Python via `uvx` | LaTeX only, math formulas |

Pick the engine in Raycast preferences → `OCR Engine` dropdown.

**LaTeX output.** Two new commands — `Recognize Math` and `Recognize Math on Entire Screen` — that extract LaTeX from screenshots. Screenshot a math problem, get `\frac{d}{dx}\int_{0}^{x} f(t)dt = f(x)` in your clipboard.

**Reproducible.** Python engines use [uv](https://docs.astral.sh/uv/) for dependency management — no `pip install` hell, packages auto-install on first use via `uvx`. Works on any machine with `uv`.

## Setup

```bash
# 1. Clone
git clone https://github.com/emirbartu/screenocr
cd screenocr

# 2. Install deps
npm install

# 3. Develop
npm run dev
```

### Optional: enable external engines

```bash
# Tesseract
brew install tesseract tesseract-lang

# Python engines (uv auto-installs everything)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Ollama engines
brew install ollama
ollama pull glm-ocr        # ~2.2GB
ollama pull deepseek-ocr
```

## Commands

- **Recognize Text** — area OCR, copies text to clipboard
- **Recognize Text on Entire Screen** — fullscreen OCR
- **Recognize Math** — area math OCR, copies text + LaTeX
- **Recognize Math on Entire Screen** — fullscreen math OCR
- **Detect Barcode/QR Code** — unchanged from upstream
- **Select Recognition Languages** — language picker

## Credits

This is a fork of [ScreenOCR by huzef44](https://www.raycast.com/huzef44/screenocr). All the VisionKit screen capture magic and the original extension structure are their work. I just bolted on multi-engine support and LaTeX output because I solve a lot of math problems and got tired of typing equations manually.
