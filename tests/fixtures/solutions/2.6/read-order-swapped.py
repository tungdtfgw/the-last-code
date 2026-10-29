# Bảng lệnh gửi 2 dòng qua kênh nhập: mã lệnh (có thể trống), rồi mức pin
pin = int(input())
ma_lenh = input()

if ma_lenh:
    if ma_lenh == "XUAT KICH":
        print("LENH: NAP")
    else:
        print("LENH: CHO")
elif pin < 30:
    print("LENH: DI")
else:
    print("LENH: CHO")
