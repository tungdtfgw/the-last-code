# Khoảng cách tới tín hiệu lạ gần nhất (KHÔNG được sửa dòng này)
khoang_cach = 10

# Mức báo động của tháp: xét từ gần nhất ra xa.
print("MUC: BAO DONG" if khoang_cach < 20 else "MUC: NGUY HIEM" if khoang_cach < 50 else "MUC: CANH GIAC" if khoang_cach < 100 else "MUC: AN TOAN")
