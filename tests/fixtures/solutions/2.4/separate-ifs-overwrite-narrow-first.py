# Khoảng cách tới tín hiệu lạ gần nhất (KHÔNG được sửa dòng này)
khoang_cach = 10

# Mức báo động của tháp: xét từ gần nhất ra xa.
muc = "AN TOAN"
if khoang_cach < 20:
    muc = "BAO DONG"
if khoang_cach < 50:
    muc = "NGUY HIEM"
if khoang_cach < 100:
    muc = "CANH GIAC"
print(f"MUC: {muc}")
