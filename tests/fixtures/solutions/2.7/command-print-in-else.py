# Dữ liệu cảm biến tháp nạp mỗi pha (KHÔNG được sửa 3 dòng này)
tam_quet = 40
camera_bat = True
den_pha = False

# Kênh nhập: dòng 1 là khoảng cách tới Kai, dòng 2 là mã lệnh của tháp (có thể trống)
khoang_cach = int(input())
ma_lenh = input()

# Luật 1 · Cảm biến tầm quét
trong_tam = khoang_cach <= tam_quet
print(f"TRONG TAM: {trong_tam}")

# Luật 4 · Thang báo động
if khoang_cach < 20:
    print("MUC: BAO DONG")
elif khoang_cach < 50:
    print("MUC: NGUY HIEM")
elif khoang_cach < 100:
    print("MUC: CANH GIAC")
else:
    print("MUC: AN TOAN")

# Luật 6 · Đọc bảng lệnh
if ma_lenh:
    if ma_lenh == "XUAT KICH":
        lenh_drone = "XUAT KICH"
    else:
        lenh_drone = "CHO LENH"
else:
    lenh_drone = "KHONG CO"
    print(f"LENH DRONE: {lenh_drone}")

# Luật 2, 3, 5 · Quyết định của Kai
if trong_tam and (camera_bat or den_pha):
    print("KAI: NAP")
elif den_pha or ma_lenh == "XUAT KICH":
    print("KAI: CHO")
else:
    print("KAI: QUA")
