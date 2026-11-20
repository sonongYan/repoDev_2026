#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
验证码 OCR 识别脚本（基于 ddddocr）
用法: python ocr_captcha.py <image_path>
输出: 识别结果到 stdout（纯数字/字母），错误到 stderr
"""
import sys
import os


def main():
    if len(sys.argv) < 2:
        sys.stderr.write("ERROR: missing image path\n")
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        sys.stderr.write(f"ERROR: image not found: {image_path}\n")
        sys.exit(1)

    try:
        import ddddocr
        ocr = ddddocr.DdddOcr(show_ad=False)
        with open(image_path, 'rb') as f:
            image_bytes = f.read()
        result = ocr.classification(image_bytes)
        # 只保留字母数字
        result = ''.join(c for c in result if c.isalnum())
        sys.stdout.write(result)
        sys.stdout.flush()
    except ImportError:
        sys.stderr.write("ERROR: ddddocr not installed. run: pip install ddddocr\n")
        sys.exit(2)
    except Exception as e:
        sys.stderr.write(f"ERROR: {e}\n")
        sys.exit(1)


if __name__ == '__main__':
    main()
