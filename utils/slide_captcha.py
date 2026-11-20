"""滑块拼图验证码求解。

输入：拼图小块 PNG（带 alpha）与背景大图 PNG。
输出：JSON {"x": 拼图图片左边缘坐标, "y": 拼图图片上边缘坐标, "score": 置信度, "method": 方法名}

原理：
背景大图中的缺口通常是「原图与纯色（黑/白）各占一半」的半透明遮罩，
即 hole = 0.5 * origin + 0.5 * color。反过来把背景按两种假设还原：
  - white: origin ≈ 2 * bg - 255
  - black: origin ≈ 2 * bg
然后用拼图小块（去掉描边后的内部区域）在还原图上做带掩码的平方差匹配，
哪个假设的峰值更显著就用哪个，峰值位置即拼图图片左边缘。

少量站点使用不透明镂空或纯色缺口，匹配失败时退回「形状内/外亮度差」检测。
"""

import json
import sys

import cv2
import numpy as np


def _load(path):
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise RuntimeError(f"无法读取图片: {path}")
    return img


def _piece(piece):
    if piece.ndim != 3 or piece.shape[2] != 4:
        raise RuntimeError("拼图小块必须是带 alpha 通道的 PNG")
    alpha = piece[:, :, 3]
    ys, xs = np.where(alpha > 10)
    if len(ys) < 50:
        raise RuntimeError("拼图小块 alpha 通道为空")
    y0, y1, x0, x1 = int(ys.min()), int(ys.max()) + 1, int(xs.min()), int(xs.max()) + 1
    rgb = piece[y0:y1, x0:x1, :3].astype(np.float32)
    solid = (alpha[y0:y1, x0:x1] > 250).astype(np.uint8)
    inner = cv2.erode(solid, np.ones((11, 11), np.uint8))
    if inner.sum() < 50:
        inner = solid if solid.sum() >= 50 else (alpha[y0:y1, x0:x1] > 10).astype(np.uint8)
    return {
        "rgb": rgb,
        "inner": inner,
        "bbox": (x0, y0),
        "shape": (y1 - y0, x1 - x0),
        "mask_full": (alpha[y0:y1, x0:x1] > 10).astype(np.float32),
    }


def _match(background, piece, hypothesis):
    if hypothesis == "white":
        est = np.clip(2.0 * background - 255.0, 0, 255)
    else:
        est = np.clip(2.0 * background, 0, 255)
    res = cv2.matchTemplate(est, piece["rgb"], cv2.TM_SQDIFF_NORMED, mask=piece["inner"] * 255)
    res = np.clip(np.nan_to_num(res, nan=9, posinf=9, neginf=9), 0, 1)
    best = float(res.min())
    median = float(np.median(res))
    std = float(res.std()) or 1e-6
    loc = np.unravel_index(int(res.argmin()), res.shape)
    return {
        "x": int(loc[1]),
        "y": int(loc[0]),
        "best": best,
        "z": (median - best) / std,
    }


def _shape_peak(background, piece):
    """形状内/外亮度差兜底：先试暗色遮罩，再试白色镂空。"""
    gray = cv2.cvtColor(background, cv2.COLOR_BGR2GRAY).astype(np.float32)
    hsv = cv2.cvtColor(background, cv2.COLOR_BGR2HSV)
    white = (
        np.clip((gray - 150.0) / 70.0, 0, 1) * (1 - np.clip(hsv[:, :, 1] / 90.0, 0, 1))
    ).astype(np.float32)
    mask = piece["mask_full"]
    k_in = mask / mask.sum()
    ring = np.clip(cv2.dilate(mask, np.ones((9, 9), np.uint8)) - mask, 0, 1)
    k_ring = ring / ring.sum()

    def conv(img, k):
        return cv2.filter2D(img, -1, k, anchor=(0, 0), borderType=cv2.BORDER_REPLICATE)

    def peak(score_map):
        h, w = mask.shape
        valid = score_map[: gray.shape[0] - h + 1, : gray.shape[1] - w + 1]
        mx = float(valid.max())
        loc = np.unravel_index(int(valid.argmax()), valid.shape)
        med = float(np.median(valid))
        std = float(valid.std()) or 1e-6
        return {"x": int(loc[1]), "y": int(loc[0]), "z": (mx - med) / std}

    dark = peak(conv(gray, k_ring) - conv(gray, k_in))
    bright = peak(conv(white, k_in) - 0.5 * conv(white, k_ring))
    return dark, bright


def solve(target_path, background_path):
    piece = _piece(_load(target_path))
    bg_img = _load(background_path)
    if bg_img.ndim == 3 and bg_img.shape[2] == 4:
        bg_img = bg_img[:, :, :3]
    bg = bg_img.astype(np.float32)
    ox, oy = piece["bbox"]

    white = _match(bg, piece, "white")
    black = _match(bg, piece, "black")

    # 匹配质量足够好（平方差很小）时，直接按显著性选择假设
    good = [h for h in (white, black) if h["best"] <= 0.15]
    if good:
        best = max(good, key=lambda h: h["z"])
        return {
            "x": best["x"] - ox,
            "y": best["y"] - oy,
            "score": round(best["z"], 2),
            "method": "unmix-white" if best is white else "unmix-black",
        }

    dark, bright = _shape_peak(bg.astype(np.uint8), piece)
    if max(dark["z"], bright["z"]) >= 2.5:
        best = dark if dark["z"] >= bright["z"] else bright
        return {
            "x": best["x"] - ox,
            "y": best["y"] - oy,
            "score": round(best["z"], 2),
            "method": "darkness" if best is dark else "brightness",
        }

    best = white if white["best"] <= black["best"] else black
    return {
        "x": best["x"] - ox,
        "y": best["y"] - oy,
        "score": round(best["best"], 4),
        "method": "unmix-fallback",
    }


def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "usage: slide_captcha.py <target.png> <background.png>"}))
        return 1
    try:
        print(json.dumps(solve(sys.argv[1], sys.argv[2])))
        return 0
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"error": str(exc)}))
        return 1


if __name__ == "__main__":
    sys.exit(main())
