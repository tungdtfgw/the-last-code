# Dữ liệu cảm biến tháp nạp mỗi pha (KHÔNG được sửa 3 dòng này)
tam_quet = 40
camera_bat = True
den_pha = False

# Kênh nhập: dòng 1 là khoảng cách tới Kai, dòng 2 là mã lệnh của tháp (có thể trống)
khoang_cach = int(input())
ma_lenh = input()


print(f"TRONG TAM: {khoang_cach <= tam_quet}")

if khoang_cach < 20:
    print("MUC: BAO DONG")
elif khoang_cach < 50:
    print("MUC: NGUY HIEM")
elif khoang_cach < 100:
    print("MUC: CANH GIAC")
else:
    print("MUC: AN TOAN")

if ma_lenh:
    if ma_lenh == "XUAT KICH":
        print("LENH DRONE: XUAT KICH")
    else:
        print("LENH DRONE: CHO LENH")
else:
    print("LENH DRONE: KHONG CO")

if khoang_cach <= tam_quet and (camera_bat or den_pha):
    print("KAI: NAP")
elif den_pha or ma_lenh == "XUAT KICH":
    print("KAI: CHO")
else:
    print("KAI: QUA")
