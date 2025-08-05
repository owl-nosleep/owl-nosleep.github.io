// 經歷資料
export interface Experience {
	year: string;
	title: string;
	description: string;
	type: "achievement" | "education" | "competition" | "certification";
	content?: string;
	order?: number;
}

export const experiences: Experience[] = [
	{
		year: "2019",
		title: "資策會-台灣少年駭客人才培育營 THITCAMP",
		description: "IOT Hacking",
		type: "education",
		order: 1,
		content: "在台灣少年駭客人才培育營學習了 IOT 駭客技術，培養了物聯網安全的基礎知識。"
	},
	{
		year: "2021",
		title: "NYCU Fintech陽明交通大學財經資訊營隊",
		description: "Rank #1",
		type: "achievement",
		order: 1,
		content: "在陽明交通大學財經資訊營隊中獲得第一名，展示了在金融科技領域的能力。"
	},
	{
		year: "2021",
		title: "Facebook Hacker Cup",
		description: "Qualified",
		type: "competition",
		order: 2,
		content: "成功通過 Facebook Hacker Cup 資格賽，展示了演算法和問題解決能力。"
	},
	{
		year: "2022",
		title: "成為白帽駭客2_跟著方丈學滲透測試實務",
		description: "2022學員",
		type: "education",
		order: 1,
		content: "參加了白帽駭客滲透測試實務課程，學習了現代網路安全滲透測試技術。"
	},
	{
		year: "2024",
		title: "CEH Certificate",
		description: "Score: 121/125 Passed",
		type: "certification",
		order: 1,
		content: "取得 Certified Ethical Hacker (CEH) 認證，測驗分數 121/125，證明了在道德駭客領域的專業知識和技能。"
	},
	{
		year: "2025",
		title: "Google資安人才培育計畫",
		description: "2025 學員",
		type: "education",
		order: 1,
		content: "參加 Google 資安人才培育計畫，學習最前沿的網路安全知識和技術。"
	},
	{
		year: "2025",
		title: "成大遊戲設計課程 - 視窗程式設計",
		description: "期末最佳專題 - 負責關卡設計實作、美術、動畫製作（團隊：西夏普爹斯）",
		type: "achievement",
		order: 2,
		content: "在成大遊戲設計課程中，獲得視窗程式設計期末最佳專題獎項，展示了程式設計和遊戲開發能力。"
	},
	{
		year: "2025",
		title: "成大資安社",
		description: "副社長",
		type: "education",
		order: 3,
		content: "擔任成大資安社副社長，負責組織各種資安活動和分享會，促進校園資安知識交流。"
	},
	{
		year: "2025",
		title: "Devcore Conference",
		description: "Participant",
		type: "education",
		order: 4,
		content: "參加 Devcore 資安會議，了解最新資安技術趨勢和攻防實務。"
	},
	{
		year: "2025",
		title: "AIS3",
		description: "軟體組",
		type: "education",
		order: 5,
		content: "參加 AIS3 (Advanced Information Security Summer School) 課程，專注於軟體安全領域的深入研究與實踐。"
	},
	{
		year: "2025",
		title: "成大資安課程：網路安全實務與社會實踐",
		description: "Rank #1（Writeups已公布網站）優質好課 推",
		type: "achievement",
		order: 6,
		content: "在成大網路安全實務課程中獲得第一名，並發布了詳細的解題 Writeups。"
	},
	{
		year: "2025",
		title: "TSCCTF",
		description: "Qualified Rank #4",
		type: "competition",
		order: 7,
		content: "在 TSCCTF 競賽中獲得第四名，成功晉級，展示了出色的 CTF 解題能力。"
	},
	{
		year: "2025",
		title: "picoCTF",
		description: "Rank #262（Contributed 4910 points）",
		type: "competition",
		order: 8,
		content: "參加全球知名的 picoCTF 資安競賽，貢獻 4910 分並獲得全球第 262 名的好成績。"
	},
	{
		year: "2025",
		title: "AIS3 pre-exam",
		description: "Rank #60",
		type: "competition",
		order: 9,
		content: "參加 AIS3 pre-exam 初試，獲得第 60 名的成績，展示了在 CTF 領域的解題能力。"
	},
	{
		year: "2025",
		title: "InfoSec CTF",
		description: "總排 Rank #7 / 大專組 Rank #4",
		type: "competition",
		order: 10,
		content: "在 InfoSec CTF 競賽中表現優異，獲得總排名第 7 名及大專組第 4 名的好成績。"
	}
];
