# Bảng lệnh gửi 2 dòng qua kênh nhập: mã lệnh (có thể trống), rồi mức pin
ma_lenh = input()
pin = int(input())

if ma_lenh:
    if ma_lenh == "XUAT KICH":
        lenh = "NAP"
    else:
        lenh = "CHO"
else:
    if pin < 30:
        lenh = "DI"
    else:
        lenh = "CHO"
print(f"LENH: {lenh}")
