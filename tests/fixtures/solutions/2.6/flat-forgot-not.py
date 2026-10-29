# Bảng lệnh gửi 2 dòng qua kênh nhập: mã lệnh (có thể trống), rồi mức pin
ma_lenh = input()
pin = int(input())

if ma_lenh == "XUAT KICH":
    print("LENH: NAP")
elif ma_lenh and pin < 30:
    print("LENH: DI")
else:
    print("LENH: CHO")
