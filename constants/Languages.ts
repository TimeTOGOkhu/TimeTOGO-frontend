import { Language } from '../store/settingsStore';

export const LANGUAGE_OPTIONS = [
  { code: 'ko' as Language, name: '한국어', flag: '🇰🇷' },
  { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
  { code: 'zh' as Language, name: '中文', flag: '🇨🇳' },
  { code: 'ja' as Language, name: '日本語', flag: '🇯🇵' },
];

export const TRANSLATIONS = {
  ko: {
    // 설정 화면
    settings: '설정',
    largeText: '더 큰 텍스트',
    language: '언어 선택',
    notifications: '알림 설정',
    extraTime: '여유 시간 설정',
    minutes: '분',
    helpFaq: 'Help & FAQ',
    about: 'About',
    
    // 메인 화면
    departure: '출발지',
    destination: '도착지',
    arrivalTime: '도착 시간',
    calculate: '계산',
    selectDeparture: '출발지를 선택하세요',
    selectDestination: '도착지를 선택하세요',
    selectArrivalTime: '도착시간을 선택하세요',
    clickLogo: '로고를 클릭하세요',
    currentLocation: '현재 위치',
    locationPermissionNeeded: '위치 권한 필요',
    locationPermissionMessage: '이 앱은 위치 정보가 필요합니다. 설정에서 위치 권한을 허용해주세요.',
    selectDeparturePlaceholder: '출발지를 선택하세요',
    selectDestinationPlaceholder: '도착지를 선택하세요',
    selectArrivalTimePlaceholder: '도착시간을 선택하세요',
    routeCalculationError: '경로 계산 오류',
    routeCalculationInitError: '경로 계산을 시작할 수 없습니다',
    missingLocation: '출발지 또는 도착지 정보가 없습니다',
    
    // 결과 화면
    route: '경로',
    weather: '날씨',
    duration: '소요 시간',

    // 히스토리 화면
    historyRouteTitle: '경로',
    historyTravelTime: '예상 소요 시간',
    historyApplyText: '적용',
    noHistory: '이전 기록이 없습니다.',
    
    // 공통
    loading: '로딩 중...',
    error: '오류가 발생했습니다',
    cancel: '취소',
    confirm: '확인',
    
    // 탭바
    explore: '경로 탐색',
    history: '이전 기록',
    tabSettings: '설정',
  },
  en: {
    // 설정 화면
    settings: 'Settings',
    largeText: 'Large Text',
    language: 'Language',
    notifications: 'Notifications',
    extraTime: 'Extra Time',
    minutes: 'min',
    helpFaq: 'Help & FAQ',
    about: 'About',
    
    // 메인 화면
    departure: 'Departure',
    destination: 'Destination',
    arrivalTime: 'Arrival Time',
    calculate: 'Calculate',
    selectDeparture: 'Please select departure',
    selectDestination: 'Please select destination',
    selectArrivalTime: 'Please select arrival time',
    clickLogo: 'Click the logo',
    currentLocation: 'Current Location',
    locationPermissionNeeded: 'Location Permission Required',
    locationPermissionMessage: 'This app requires location information. Please allow location permission in settings.',
    selectDeparturePlaceholder: 'Please select departure',
    selectDestinationPlaceholder: 'Please select destination',
    selectArrivalTimePlaceholder: 'Please select arrival time',
    routeCalculationError: 'Route calculation error',
    routeCalculationInitError: 'Cannot start route calculation',
    missingLocation: 'Departure or destination information is missing',
    
    // 결과 화면
    route: 'Route',
    weather: 'Weather',
    duration: 'Duration',

    // History Screen
    historyRouteTitle: 'Route',
    historyTravelTime: 'Estimated Travel Time',
    historyApplyText: 'Apply',
    noHistory: 'No previous history.',
    
    // 공통
    loading: 'Loading...',
    error: 'An error occurred',
    cancel: 'Cancel',
    confirm: 'Confirm',
    
    // 탭바
    explore: 'Explore',
    history: 'History',
    tabSettings: 'Settings',
  },
  zh: {
    // 설정 화면
    settings: '设置',
    largeText: '大字体',
    language: '语言选择',
    notifications: '通知设置',
    extraTime: '额外时间',
    minutes: '分钟',
    helpFaq: '帮助与FAQ',
    about: '关于',
    
    // 메인 화면
    departure: '出发地',
    destination: '目的地',
    arrivalTime: '到达时间',
    calculate: '计算',
    selectDeparture: '请选择出发地',
    selectDestination: '请选择目的地',
    selectArrivalTime: '请选择到达时间',
    clickLogo: '点击标志',
    currentLocation: '当前位置',
    locationPermissionNeeded: '需要位置权限',
    locationPermissionMessage: '此应用需要位置信息。请在设置中允许位置权限。',
    selectDeparturePlaceholder: '请选择出发地',
    selectDestinationPlaceholder: '请选择目的地',
    selectArrivalTimePlaceholder: '请选择到达时间',
    routeCalculationError: '路线计算错误',
    routeCalculationInitError: '无法开始路线计算',
    missingLocation: '缺少出发地或目的地信息',
    
    // 결과 화면
    route: '路线',
    weather: '天气',
    duration: '所需时间',

    // 历史记录屏幕
    historyRouteTitle: '路线',
    historyTravelTime: '预计行程时间',
    historyApplyText: '应用',
    noHistory: '没有以前的记录。',
    
    // 공통
    loading: '加载中...',
    error: '发生错误',
    cancel: '取消',
    confirm: '确认',
    
    // 탭바
    explore: '路线探索',
    history: '以前的记录',
    tabSettings: '设置',
  },
  ja: {
    // 설정 화면
    settings: '設定',
    largeText: '大きなテキスト',
    language: '言語選択',
    notifications: '通知設定',
    extraTime: '余裕時間設定',
    minutes: '分',
    helpFaq: 'ヘルプ・FAQ',
    about: 'について',
    
    // 메인 화면
    departure: '出発地',
    destination: '目的地',
    arrivalTime: '到着時間',
    calculate: '計算',
    selectDeparture: '出発地を選択してください',
    selectDestination: '目的地を選択してください',
    selectArrivalTime: '到着時間を選択してください',
    clickLogo: 'ロゴをクリックしてください',
    currentLocation: '現在地',
    locationPermissionNeeded: '位置情報の許可が必要です',
    locationPermissionMessage: 'このアプリは位置情報が必要です。設定で位置情報の許可をしてください。',
    selectDeparturePlaceholder: '出発地を選択してください',
    selectDestinationPlaceholder: '目的地を選択してください',
    selectArrivalTimePlaceholder: '到着時間を選択してください',
    routeCalculationError: 'ルート計算エラー',
    routeCalculationInitError: 'ルート計算を開始できません',
    missingLocation: '出発地または目的地の情報がありません',
    
    // 결과 화면
    route: 'ルート',
    weather: '天気',
    duration: '所要時間',

    // 履歴画面
    historyRouteTitle: 'ルート',
    historyTravelTime: '推定所要時間',
    historyApplyText: '適用',
    noHistory: '以前の履歴はありません。',
    
    // 공통
    loading: '読み込み中...',
    error: 'エラーが発生しました',
    cancel: 'キャンセル',
    confirm: '確認',
    
    // 탭바
    explore: 'ルート探索',
    history: '以前の履歴',
    tabSettings: '設定',
  },
};
