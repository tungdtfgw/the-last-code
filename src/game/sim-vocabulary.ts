import { simulationOf, type LevelDefinition } from "./level-types";

/** Words that belong to a kind of simulation, not to the shared engine. */
export interface SimVocabulary {
  /** First terminal line: `> LƯỢT CHẠY #n: {runTarget}`. */
  runTarget: string;
  /** What opens: `> {gate}: MỞ HOÀN TOÀN`. */
  gate: string;
  /** Counter-attack survived. */
  counterSurvived: string;
  /** Output line prefixes. */
  sent: string;
  dropped: string;
  objectivesNote: string;
  terminalNote: string;
  /** Results dialog title for 1, 2 and 3 stars. */
  headlines: [string, string, string];
}

const SCANNER: SimVocabulary = {
  runTarget: "gửi tín hiệu tới máy quét",
  gate: "CỔNG",
  counterSurvived: "DỮ LIỆU MỚI ĐI QUA MÁY QUÉT: mã vẫn đứng vững",
  sent: "ĐÃ PHÁT",
  dropped: "BỎ GÓI",
  objectivesNote: "máy quét chỉ đọc hình dạng",
  terminalNote: "nhật ký máy quét",
  headlines: ["Qua cổng, bị ghi nhận", "Cổng mở một nửa", "Cổng mở hoàn toàn"],
};

export function vocabularyFor(level: Pick<LevelDefinition, "simulation">): SimVocabulary {
  const sim = simulationOf(level);
  switch (sim.kind) {
    case "relay":
      return {
        runTarget: `phát qua trạm ${sim.station}`,
        gate: "KÊNH",
        counterSurvived: "PHIÊN MỚI ĐI QUA TRẠM: mã vẫn đứng vững",
        sent: `${sim.station} ĐÃ PHÁT`,
        dropped: `${sim.station} BỎ GÓI`,
        objectivesNote: "trạm chỉ nhận đúng từng ký tự",
        terminalNote: `nhật ký trạm ${sim.station}`,
        headlines: ["Kênh mở, bị ghi nhận", "Kênh mở một nửa", "Kênh mở hoàn toàn"],
      };
    case "kiosk":
      return {
        runTarget: "nạp hồ sơ vào ki-ốt",
        gate: "CỔNG KHU",
        counterSurvived: "HỒ SƠ KIỂM TRA ĐI QUA KI-ỐT: mã vẫn đứng vững",
        sent: "ĐÃ PHÁT",
        dropped: "BỎ GÓI",
        objectivesNote: "ki-ốt chỉ đọc ô nhớ có nhãn",
        terminalNote: "nhật ký ki-ốt",
        headlines: ["Hồ sơ qua, bị ghi nhận", "Cổng khu mở một nửa", "Cổng khu mở hoàn toàn"],
      };
    case "sorter":
      return {
        runTarget: "gửi hồ sơ qua máy phân loại",
        gate: "RÀO SÂN GA",
        counterSurvived: "MÃ PHIÊN MỚI ĐI QUA MÁY PHÂN LOẠI: mã vẫn đứng vững",
        sent: "ĐÃ PHÁT",
        dropped: "BỎ GÓI",
        objectivesNote: "máy quét chỉ đọc hình dạng",
        terminalNote: "nhật ký máy phân loại",
        headlines: ["Rào mở, bị ghi nhận", "Rào mở một nửa", "Rào mở hoàn toàn"],
      };
    case "scanner":
      return SCANNER;
  }
}
