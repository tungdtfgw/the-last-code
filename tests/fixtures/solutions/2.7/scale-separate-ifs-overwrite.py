# Dữ liệu cảm biến tháp nạp mỗi pha (KHÔNG được sửa 3 dòng này)
tam_quet = 40
camera_bat = True
den_pha = False

# Kênh nhập: dòng 1 là khoảng cách tới Kai, dòng 2 là mã lệnh của tháp (có thể trống)
khoang_cach = int(input())
ma_lenh = input()


trong_tam = khoang_cach <= tam_quet
print(f"TRONG TAM: {trong_tam}")

muc = "AN TOAN"
if khoang_cach < 100:
    muc = "CANH GIAC"
if khoang_cach < 50:
    muc = "NGUY HIEM"
if khoang_cach < 20:
    muc = "BAO DONG"
print(f"MUC: {muc}")

if ma_lenh:
    if ma_lenh == "XUAT KICH":
        print("LENH DRONE: XUAT KICH")
    else:
        print("LENH DRONE: CHO LENH")
else:
    print("LENH DRONE: KHONG CO")

if trong_tam and (camera_bat or den_pha):
    print("KAI: NAP")
elif den_pha or ma_lenh == "XUAT KICH":
    print("KAI: CHO")
else:
    print("KAI: QUA")
