import type { I18n } from "emoji-picker-element/shared";

export default {
	categoriesLabel: "카테고리",
	emojiUnsupportedMessage: "이 브라우저에서는 컬러 이모지를 표시할 수 없어요.",
	favoritesLabel: "즐겨찾기",
	loadingMessage: "불러오는 중…",
	networkErrorMessage: "이모지를 불러오지 못했어요.",
	regionLabel: "이모지 선택",
	searchDescription: "검색 결과가 나오면 위아래 방향키로 이동하고 Enter 키로 선택하세요.",
	searchLabel: "검색",
	searchResultsLabel: "검색 결과",
	skinToneDescription: "목록이 펼쳐지면 위아래 방향키로 이동하고 Enter 키로 선택하세요.",
	skinToneLabel: "피부색 선택 (현재: {skinTone})",
	skinTonesLabel: "피부색",
	skinTones: [
		"기본",
		"밝음",
		"약간 밝음",
		"중간",
		"약간 어두움",
		"어두움"
	],
	categories: {
		custom: "커스텀",
		"smileys-emotion": "스마일리 및 감정",
		"people-body": "사람 및 신체",
		"animals-nature": "동물 및 자연",
		"food-drink": "음식 및 음료",
		"travel-places": "여행 및 장소",
		activities: "활동",
		objects: "사물",
		symbols: "기호",
		flags: "깃발"
	}
} satisfies I18n;
