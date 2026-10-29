# Bảng lệnh gửi 2 dòng qua kênh nhập: mã lệnh (có thể trống), rồi mức pin
ma_lenh = input()
pin = int(input())

if ma_lenh:
    if ma_lenh == "XUAT KICH":
        print("LENH: NAP")
else:
    print("LENH: CHO")
