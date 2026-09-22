// EVENT CONFIGURATION
// Giữ nguyên cấu trúc giao diện; chỉ sửa nội dung, màu, ảnh và tỉ lệ quà tại đây.
// Tổng chancePercent của tất cả phần quà nên bằng 100.

export interface Reward {
  id: string;
  name: string;
  image: string;
  chancePercent: number;
}

export const eventConfig = {
  brand: {
    name: "CrossFire Legends",
    logo: "/event-assets/logo.jpg",
    scratchLogo: "/event-assets/logo.jpg",
    eventName: "CrossFire Legends",
    year: "2026",
  },
  theme: {
    primary: "#e85d32",
    primaryDark: "#a9361f",
    seal: "#eb0a1e",
    scratchHighlight: "#ffd0ad",
    ink: "#24130d",
    background: "#efb57f",
    muted: "#7c5040",
    border: "#e3a36f",
  },
  copy: {
    artworkRatio: "3 : 4",
    boothName: "BOOTH 1",
    stampBooth: "BOOTH 01",
    boothKicker: "Vùng đóng dấu thẻ",
    stampEventLine: "CROSSFIRE LEGENDS · 2026",
    stampValidated: "VALIDATED",
    openReward: "Hãy Mở Phần Quà Của Bạn",
    yourReward: "Chúc mừng bạn nhận được",
    received: "BẠN ĐÃ NHẬN ĐƯỢC",
    backHome: "Về trang chủ",
    scratchAriaLabel: "Cào thẻ nhận quà, hoặc nhấn Enter để mở",
  },
  timing: {
    stampTransitionMs: 1650,
    scratchRevealMs: 1100,
  },
  scratch: {
    completionPercent: 30,
    brushSize: 62,
  },
  stamp: {
    image: "/event-assets/dongdau.jpg",
  },
  rewards: [
    {
      id: "sticker",
      name: "01 Sticker CFL",
      image: "/event-assets/stickerCFL.jpg",
      chancePercent: 50,
    },
    {
      id: "mockhoa",
      name: "01 Móc khóa CFL",
      image: "/event-assets/mockhoaCFL.jpg",
      chancePercent: 25,
    },
    {
      id: "tui",
      name: "01 Túi xách CFL",
      image: "/event-assets/tuiCFL.jpg",
      chancePercent: 15,
    },
    {
      id: "hopgau",
      name: "01 Hộp gấu CFL",
      image: "/event-assets/hopgauCFL.jpg",
      chancePercent: 10,
    },
  ] satisfies Reward[],
};

export function pickWeightedReward(
  rewards: readonly Reward[] = eventConfig.rewards,
): Reward {
  const availableRewards = rewards.filter((reward) => reward.chancePercent > 0);
  const totalChance = availableRewards.reduce(
    (sum, reward) => sum + reward.chancePercent,
    0,
  );

  if (availableRewards.length === 0 || totalChance <= 0) {
    throw new Error("Cần ít nhất một phần quà có chancePercent lớn hơn 0.");
  }

  let ticket = Math.random() * totalChance;
  for (const reward of availableRewards) {
    ticket -= reward.chancePercent;
    if (ticket < 0) return reward;
  }

  return availableRewards[availableRewards.length - 1];
}
