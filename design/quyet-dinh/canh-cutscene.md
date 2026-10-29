# Cảnh vẽ cho cutscene Chương 1

Ngày: 2026-10-28. Yêu cầu của người dùng: cutscene mở đầu và giữa các level đang nhàm chán; mỗi đoạn cần một cảnh khác nhau, vẽ khung cảnh khớp cốt truyện lúc đó. Quyết định kỹ thuật: QĐ-18 trong `docs/quyet-dinh-ky-thuat.md` (thay QĐ-17).

## Đã chốt

- Cảnh địa điểm vẽ bằng SVG, cùng phong cách với giao diện hiện có (ma trận chấm, nét mảnh, xanh tín hiệu và đỏ OMNI), thêm không khí ma mị. Không "cyberpunk hậu tận thế". Bản ảnh AI thử trước đó đã bỏ.
- Giữ nguyên câu chữ và số nhịp: chỉ đổi `backdrop`/`fx` của nhịp và thêm trường câu đố `scene` của level. Không có migration D1.
- Buồng trực Cổng Kiểm Soát chỉ có ánh đèn, không có bóng người: Nhi chỉ xuất hiện qua lời truyện.
- Cảnh không có chữ; người nếu có chỉ là bóng xa. Chủ thể ở nửa trên, nửa dưới tối (cột chữ nằm ở đó).

## Hệ thống hình (định hướng nghệ thuật)

Mọi cảnh phải theo đúng các trục dưới đây; cảnh nào đẹp riêng lẻ mà lệch hệ thống thì sửa lại cho khớp.

| Trục | Quy ước |
|---|---|
| Khung | SVG 160×90, phối cảnh một điểm tụ ngang tầm mắt (riêng cảnh mái nhà nhìn ngang). Chủ thể ở nửa trên; 40% dưới tối và thưa vì cột chữ nằm đó. |
| Hình khối | Kiến trúc vuông vức, góc cứng. Chỉ dây điện, sương, cỏ và vải là đường cong. |
| Mảng sáng tối | Ba mảng: khoảng tối (`--bg-deep`), khối chấm (ma trận chấm của bản đồ, hai độ đậm: gần và xa), nguồn sáng. Che màu đi vẫn đọc được cảnh. |
| Màu theo vai | Xanh tín hiệu: thứ của Kai và Mạng Mù (khe sàn, sóng R-17, đầu đọc, cổng quét). Đỏ OMNI: thứ đang theo dõi (đèn đầu cột, mắt, camera, drone, dải viền cổng). Vàng ấm: đèn của người (bóng đèn, buồng trực, đèn trần). Không thêm màu thứ tư. |
| Nét | Viền mảnh màu chấm; nét gần nguồn sáng nhận màu của nguồn sáng (viền sáng). |
| Vật liệu | Bê tông và tường: tô chấm. Kim loại: viền mảnh, đường nối, đinh tán. Kính: mảng mờ cùng một vệt phản chiếu. Ánh sáng: quầng tỏa và vũng sáng in trên sàn. |
| Chi tiết | Dồn quanh chủ thể (điểm `focus`); rìa khung thưa. Mỗi cảnh có ít nhất một chi tiết "sống" kể chuyện (giọt nước rỉ, quần áo phơi, rào chắn xếp hàng, ghế trống). |
| Chuyển động | Chậm và dè dặt: sương trôi, bụi, đèn chập chờn, vật treo đung đưa, giọt nước rơi. Không nảy, không giật mạnh; thỉnh thoảng cả cảnh nhoè một nhịp. |

Kiểm ở ba khoảng cách: cỡ thật 1280×800 dưới lớp chữ; cỡ điện thoại 360×740; và phóng to khi `focus`.

## Phông

| id | Kiểu | Nội dung |
|---|---|---|
| `thanh-pho` | bản đồ | ma trận chấm thành phố; có `city_blink`, `eight_fragments`, `fragment_found`, `trace` (Vùng Tối → cổng) |
| `vung-toi` | bản đồ | thu gần vào khu chấm tắt |
| `terminal` | laptop | khung laptop |
| `tang-ham` | cảnh vẽ | tầng hầm Lô 17, khe sàn giấu laptop |
| `tram-r17` | cảnh vẽ | trạm chuyển tiếp R-17 |
| `tram-khau-phan` | cảnh vẽ | Trạm Phát Khẩu Phần số 4 |
| `ga-ngam` | cảnh vẽ | Ga Ngầm Số 3, bóng người đưa tin cuối sân ga |
| `cong-bac` | cảnh vẽ | Cổng phía Bắc |
| `vanh-dai-dien` | cảnh vẽ | Vành Đai Điện |
| `tram-tham-van` | cảnh vẽ | Trạm Thẩm Vấn |
| `cong-kiem-soat` | cảnh vẽ | Cổng Kiểm Soát, buồng trực sáng đèn, trống |
| `tram-sentinel` | cảnh vẽ | Trạm Sentinel ở biên giới thành phố |

Hình vẽ: `src/ui/scene-art.tsx`. Không khí chung của mọi cảnh: sương trôi, bụi lơ lửng, viền tối, đèn chập chờn, thỉnh thoảng cả cảnh nhoè một nhịp. Điểm `focus` và đường `trace` của từng cảnh: `src/story/scene-catalog.ts`.

## Hiệu ứng

- Phủ trên mọi phông: `alert_tick`, `id_bar`, `signal_0xa7` (khung xé nhiễu, chuỗi hex 0xA7 hiện lên; dùng cho mọi thẻ "TÍN HIỆU · 0xA7"), `omni_layer` (lưới đỏ của OMNI phủ trời), `scan` (vạch quét lướt hai lần).
- Theo cảnh: `focus` (máy quay tiến vào chủ thể của cảnh, lùi ra khi nhịp sau bỏ hiệu ứng), `trace` (vệt sáng chạy theo đường của cảnh).
- Chỉ thành phố: `city_blink`, `eight_fragments`, `fragment_found` (một mảnh sáng xanh, bảy mảnh tắt).
- Một test (`src/story/scene-catalog.test.ts`) bắt mọi hiệu ứng theo cảnh phải nằm trên phông có hỗ trợ.

## Gắn vào truyện

Chỉ số từ 0. P = prologue, T = đoạn hết chương (`teaser`), OBn = `outro_beats[n]`. Đoạn after-<id> mở bằng nhịp outro trên cảnh `scene` của level.

- **Mở đầu:** P0–5 `thanh-pho` (`city_blink`@2, `eight_fragments`@4); P6 `vung-toi`; P7 `tang-ham` ("Tôi sống dưới tầng hầm Lô 17"); P9 thẻ NX-0417 + `scan`; P11 `focus` vào khe sàn ("Dưới sàn nhà, tôi giấu một chiếc laptop"); P12 `terminal` (`alert_tick`@18, `id_bar`@20); P22 `thanh-pho` + `trace`.
- **after-1.1:** `tram-r17`; OB0 `terminal`; OB1 `signal_0xa7`.
- **after-1.2:** `tram-khau-phan`; OB2 `signal_0xa7`.
- **after-1.3:** `ga-ngam`; OB0–1 `focus` (người đưa tin cuối sân ga, chip còn phát); OB2 `signal_0xa7`.
- **after-1.4:** `cong-bac`; OB3 `omni_layer` ("Từ một tầng mạng mà Vùng Tối không có").
- **after-1.5:** `vanh-dai-dien`; OB0 `tram-tham-van`; OB2 `cong-kiem-soat` + `focus` (ca đêm, người đứng gác).
- **after-1.6:** `tram-tham-van`; OB0 `cong-kiem-soat`; OB1 `focus`; OB2 `signal_0xa7`; OB3 `trace` (tín hiệu phát từ bên trong cổng).
- **after-1.7:** `cong-kiem-soat`; OB0 `focus` (kính buồng trực); OB1 `scan` (dấu duyệt trễ một nhịp); OB2 `thanh-pho` + `fragment_found` (mảnh 1/8); OB3 `cong-kiem-soat` + `signal_0xa7`; OB4 `omni_layer`.
- **Hết chương:** T0 `cong-kiem-soat`; T2 `thanh-pho` + `fragment_found`; T3 `tram-sentinel`; T4 `signal_0xa7`; T6–7 `cong-kiem-soat` + `focus` (nhật ký ca trực, "Anh sẽ quay lại, Nhi."); T8 `tram-sentinel`.

## Hành vi

- Đổi phông: phông mới mờ dần lên trên phông cũ trong 600 ms; hoạt ảnh vào cảnh chỉ chạy khi phông đổi, không chạy lại mỗi nhịp.
- Cảnh trôi chậm (Ken Burns). Trên màn hẹp, khung cảnh trượt để giữ chủ thể trong tầm nhìn.
- Giảm chuyển động (bản chép): một phông tĩnh là phông của nhịp đầu, mờ hơn, không hiệu ứng.
- Tab ẩn: mọi hoạt ảnh dừng.
