// CrossFire Legend event setup: Assets, theme, copy and rewards.

export interface Reward {
  id: string
  name: string
  congratulation: string
  image: string
}

export const eventConfig = {
  brand: {
    name: 'CrossFire Legend',
    logo: '/event-assets/logo.jpg',
    scratchLogo: '/event-assets/logo.jpg',
  },
  theme: {
    primary: '#e85d36',
    primaryDark: '#9c291c',
    scratchHighlight: '#ffd15c',
    ink: '#15110f',
    background: '#f5bd88',
  },
  copy: {
    step2Badge: 'BƯỚC 2 — ĐÓNG DẤU',
    stampPrompt: 'Thẻ chứng nhận sự kiện',
    stampInstruction: 'Chạm vào thẻ để đóng dấu',
    stampedStatus: 'Đã đóng dấu thành công!',
    step3Badge: 'BƯỚC 3 — CÀO THẺ NHẬN QUÀ',
    rewardSubheading: 'Phần quà may mắn từ CrossFire Legend',
    scratchInstruction: 'Cào lớp bạc để mở quà may mắn!',
    scratchAriaLabel: 'Cào thẻ nhận quà, hoặc nhấn Enter để mở',
    restartAriaLabel: 'Đóng dấu lượt mới',
    restart: 'Đóng dấu lượt mới',
  },
  stamp: {
    image: '/event-assets/valid.jpg',
    confirmationImage: '/event-assets/dongdau.jpg',
  },
  rewards: [
    {
      id: 'hopgau',
      name: 'Hộp Gấu CFL',
      congratulation: 'Chúc mừng bạn nhận được 1 Hộp Gấu CFL',
      image: '/event-assets/hopgauCFL.jpg',
    },
    {
      id: 'mockhoa',
      name: 'Móc Khóa CFL',
      congratulation: 'Chúc mừng bạn nhận được 1 Móc Khóa CFL',
      image: '/event-assets/mockhoaCFL.jpg',
    },
    {
      id: 'sticker',
      name: 'Sticker CFL',
      congratulation: 'Chúc mừng bạn nhận được 1 Sticker CFL',
      image: '/event-assets/stickerCFL.jpg',
    },
    {
      id: 'tui',
      name: 'Túi CFL',
      congratulation: 'Chúc mừng bạn nhận được 1 Túi CFL',
      image: '/event-assets/tuiCFL.jpg',
    },
  ] as const satisfies readonly Reward[],
}
