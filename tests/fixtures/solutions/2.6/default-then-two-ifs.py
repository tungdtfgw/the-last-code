# Bảng lệnh gửi 2 dòng qua kênh nhập: mã lệnh (có thể trống), rồi mức pin
ma_lenh = input()
pin = int(input())

lenh = "CHO"
if ma_lenh == "XUAT KICH":
    lenh = "NAP"
if ma_lenh == "" and pin < 30:
    lenh = "DI"
print(f"LENH: {lenh}")
