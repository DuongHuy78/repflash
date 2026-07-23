// frontend/src/utils/streakUtils.js

export const getStreakConfig = (streak = 0) => {
  if (streak >= 200) {
    return {
      icon: '∞',
      badgeClass: 'streak-badge-rainbow-infinity',
      title: 'Vũ Trụ Vô Cực 🌌'
    };
  }
  if (streak >= 60) {
    return {
      icon: '🔥',
      badgeClass: 'streak-badge-rainbow',
      title: 'Hỏa Long Cầu Vồng 🌈'
    };
  }
  if (streak >= 30) {
    return {
      icon: '🔥',
      badgeClass: 'streak-badge-diamond',
      title: 'Hỏa Vương Diamond 🧊'
    };
  }
  if (streak >= 14) {
    return {
      icon: '🔥',
      badgeClass: 'streak-badge-purple',
      title: 'Ma Hỏa Tím 🔮'
    };
  }
  if (streak >= 7) {
    return {
      icon: '🔥',
      badgeClass: 'streak-badge-gold',
      title: 'Hỏa Thần 🔴'
    };
  }
  if (streak >= 3) {
    return {
      icon: '🔥',
      badgeClass: 'streak-badge-silver',
      title: 'Tia Lửa ⚡'
    };
  }
  return {
    icon: '🔥',
    badgeClass: 'streak-badge-bronze',
    title: 'Khởi Động 🌟'
  };
};
