# Dữ liệu cảm biến tháp nạp mỗi pha (KHÔNG được sửa 3 dòng này)
tam_quet = 40
camera_bat = True
den_pha = False

# Kênh nhập: dòng 1 là khoảng cách tới Kai, dòng 2 là mã lệnh của tháp (có thể trống)
khoang_cach = int(input())
ma_lenh = input()


trong_tam = khoang_cach <= tam_quet
print(f"TRONG TAM: {trong_tam}")

if khoang_cach < 20:
    muc = "BAO DONG"
elif khoang_cach < 50:
    muc = "NGUY HIEM"
elif khoang_cach < 100:
    muc = "CANH GIAC"
else:
    muc = "AN TOAN"
print(f"MUC: {muc}")

if ma_lenh:
    if ma_lenh == "XUAT KICH":
        lenh_drone = "XUAT KICH"
    else:
        lenh_drone = "CHO LENH"
else:
    lenh_drone = "KHONG CO"
print(f"LENH DRONE: {lenh_drone}")

if trong_tam and (camera_bat or den_pha):
    kai = "NAP"
elif den_pha or ma_lenh == "XUAT KICH":
    kai = "CHO"
else:
    kai = "QUA"
print(f"KAI: {kai}")
