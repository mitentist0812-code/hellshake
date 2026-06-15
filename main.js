class Keisan {
    //初期化
    constructor(rootElm) {
        this.rootElm = rootElm;

        if (localStorage.getItem('score') === null) {
            localStorage.setItem('score',0);
        }
        
        this.gameSetting = {
            level: null,
            intervalKey: null,
            correct:0,
            highScore: Number(localStorage.getItem('score')),
            newRecord:false
        };

    }

    //実行部
    async init() {
        await this.getData();
        this.displayTitle();
    }

    async getData() {
        await this.getLevelData();
        await this.getHtpData();
    }

    //jsonファイルから出題範囲のデータを取得
    async getLevelData() {
        try {
            const response = await fetch('level.json');
            this.levelData = await response.json();
        } catch (e) {
            this.rootElm.innerText = '問題の読み込みに失敗しました'
            console.log(e)
        }
    }
    //jsonファイルから遊び方用のhtmlテキストを取得
    async getHtpData() {
        try {
            const response = await fetch('HowToPlay.json');
            this.htpData = await response.json();
            this.preloadHtpImages();
        } catch (e) {
            this.rootElm.innerText = '問題の読み込みに失敗しました'
            console.log(e)
        }
    }
//画像をあらかじめロードしておく
    preloadHtpImages() {

        this.htpData.forEach(data => {

            const img = new Image();

            img.src = data.img;
        });
    }

/////////////////////////////////内部処理関数群///////////////////////////////////
    //タイマーの内部数値の処理をする
    // func = 次に実行させたい関数
    // disp = カウントダウン終了時に表示する文字列
    countDownTimer(func,disp) {
        if(this.gameSetting.intervalKey !== null) {
                throw new Error('まだタイマーが動いています');
        }
        this.gameSetting.intervalKey = setInterval(() => {
            this.gameSetting.time--;
            this.displayTime();
            //0になったときのみdispをdisplayTimeに引き渡す
            if (this.gameSetting.time < 0){
                this.clearTimer();
                func();
            } else if(this.gameSetting.time === 0) {
                this.displayStr(disp);
            }
        },1000);
    }
    //タイマーの数値を加工し表示する
    setTime() {
        let i = this.gameSetting.time;
        let m = Math.floor(i / 60); //分
        let s = i % 60; //秒
        //1分以上で秒数が10秒未満である場合秒数を2桁表示させる
        if (s < 10 && m !== 0) {
            s = '0'+s;
        }
        let set;
        //1分未満になったら秒数のみ表示する("0:"の表示をしない)
        if (m === 0) {
            set = `${s}`;
        } else {
            set = `${m}:${s}`;
        }
        // console.log(set);
        this.gameSetting.set = set;
    }

    //タイマーをリセット
    clearTimer() {
        clearInterval(this.gameSetting.intervalKey);
        this.gameSetting.intervalKey = null;
    }

    //問題に使用する数値を指定された範囲からランダムに返す
    //指定された範囲はjsonファイルから受け取る
    createNum() {
        let min = this.levelData[this.gameSetting.level].min;
        let max = this.levelData[this.gameSetting.level].max + 1;
        
        let num = Math.floor(Math.random() * (max - min) + min);
        return num;
    }

    //問題に関しての解答の正誤を判定する。正しい場合は正答数をカウントし次の問題の表示、誤りの場合は何もしない
    keisanCheck() {
        const countElm = this.rootElm.querySelector('.correctCount');
        if (this.gameSetting.inputAns === this.gameSetting.answer) {
            this.gameSetting.correct++;
            this.displayMondai();
            countElm.innerText = `正答数:${this.gameSetting.correct}`;
        }
    }

    //正答数に応じてランクを決める。
    //30問以上正解の場合はS
    //20問以上はA
    // 10問以上でB
    // 10問未満でCとする
    rank() {
        let i = this.gameSetting.correct;

        if (i >= 30) {
            this.gameSetting.resultRank = 'S';
            this.gameSetting.rankClass = 'rank-s';

        } else if (i >= 20) {
            this.gameSetting.resultRank = 'A';
            this.gameSetting.rankClass = 'rank-a';

        } else if (i >= 10) {
            this.gameSetting.resultRank = 'B';
            this.gameSetting.rankClass = 'rank-b';

        } else {
            this.gameSetting.resultRank = 'C';
            this.gameSetting.rankClass = 'rank-c';
        }
    }

    //戻るボタンの設定
    backBtn(func,elm) {
        const backBtnElm = elm.querySelector('.backBtn');
        backBtnElm.addEventListener('click', () => {
            func();
        });
    }
///////////////////////////////////////////////////////////////////////////////

/////////////////////////////画面表示用関数群///////////////////////////////////
//タイトル画面を表示、ボタンのクリックでdisplayStartを実行
    displayTitle() {
        const html =`
            <img src="img/title_logo.png" class="title">
            <div class="action">
                <button class="titleBtn">始める</button>
                <button class="HtPBtn miniBtn">遊び方</button>
            </div>
            <p class="str" id="score">最高記録：${this.gameSetting.highScore}</p>
            `;

        const parentElm = document.createElement('div');
        parentElm.innerHTML = html; 
        
        //次画面へ遷移
        const titleBtnElm = parentElm.querySelector('.titleBtn');
        titleBtnElm.addEventListener('click', () => {
            this.displayStart();
        });
        //遊び方画面へ遷移
        const HtPBtnElm = parentElm.querySelector('.HtPBtn');
        HtPBtnElm.addEventListener('click', () => {
            this.displayHowToPlay();
        });

        this.replaceView(parentElm);
    }

    //遊び方画面を表示
    displayHowToPlay() {
        this.current = 0;

        const parentElm = document.createElement('div');

        parentElm.innerHTML = `
            <div class="HtP">
                <h1>遊び方</h1>

                <div class="set">
                    <img class="setImg">

                    <div class="setText"></div>
                </div>

                <div class="Page">
                    <button class="miniBtn beforePage">前へ</button>

                    <p class="currentPage str"></p>

                    <button class="miniBtn nextPage">次へ</button>
                </div>

                <div class="action">
                    <button class="miniBtn backBtn">戻る</button>
                </div>
            </div>
        `;

        this.replaceView(parentElm);

        this.updateSetumei(parentElm);

        const beBtn = parentElm.querySelector('.beforePage');
        // 遊び方前ページへ
        beBtn.addEventListener('click', () => {

            this.current =
                (this.current - 1 + this.htpData.length)
                % this.htpData.length;

            this.updateSetumei(parentElm, 'prev');
        });

        const neBtn = parentElm.querySelector('.nextPage');
        // 遊び方次ページへ
        neBtn.addEventListener('click', () => {

            this.current =
                (this.current + 1)
                % this.htpData.length;

            this.updateSetumei(parentElm, 'next');
        });

        this.backBtn(() => {
            this.displayTitle();
        }, parentElm);
    }

    //遊び方ページ切り替え
    updateSetumei(parentElm, dir = 'next') {

        const data = this.htpData[this.current];

        const setElm = parentElm.querySelector('.set');
        const imgElm = parentElm.querySelector('.setImg');
        const textElm = parentElm.querySelector('.setText');
        const pageElm = parentElm.querySelector('.currentPage');

        setElm.classList.remove('slideNext', 'slidePrev');

        void setElm.offsetWidth;

        // アニメーション用クラスを追加
        setElm.classList.add(
            dir === 'next'
                ? 'slideNext'
                : 'slidePrev'
        );

        imgElm.src = data.img;

        textElm.innerHTML = data.text.join('<br>');

        pageElm.innerText =
            `${this.current + 1} / ${this.htpData.length}`;
    }
    

    //スタート画面を表示、ボタンのクリックでdisplayCountDownを実行
    displayStart() {
        this.gameSetting.correct = 0;
        this.gameSetting.newRecord = false;
        const levelStrs = Object.keys(this.levelData);
        this.gameSetting.level = levelStrs[0];
        const optionStrs = [];
        for (let i = 0; levelStrs.length > i; i++) {
            optionStrs.push(`<option value="${levelStrs[i]}" name="level">${levelStrs[i]}</option>`);            
        }

        const html = `
            <p class="str">難易度を選択</p>
            <div class="action">
                <div class="selectWrapper">
                    <select class="levelSelector">
                        ${optionStrs.join('')}
                    </select>
                </div>
                <button class="startBtn">スタート</button>
                <button class="miniBtn backBtn">戻る</button>
            </div>
        `;

        const parentElm = document.createElement('div');
        parentElm.innerHTML = html;

        //次画面へ遷移
        const startBtnElm = parentElm.querySelector('.startBtn');
        startBtnElm.addEventListener('click', () => {
            this.displayCountDown();
        });

        //プルダウンメニューで指定した難易度を格納する
        const selectorElm = parentElm.querySelector('.levelSelector');
        selectorElm.addEventListener('change', (event) => {
            this.gameSetting.level = event.target.value;
        });

        this.backBtn(() => {
            this.displayTitle();
        },parentElm);

        this.replaceView(parentElm);
    }

    //カウントダウン画面を表示、３秒後diplayKeisanを実行
    displayCountDown() {
        this.gameSetting.time = 3;
        this.setTime();
        const html = `
        <p class="timer str" id="countDown">${this.gameSetting.set}</p>
        `;
        
        const parentElm = document.createElement('div');
        parentElm.innerHTML = html;
        
        
        this.replaceView(parentElm);

        this.countDownTimer(() => {
            this.displayKeisan();
        },'START!');
    }
    
    //計算ゲームメイン画面表示、inputに数値を入力しEnter押下で次の問題へ、タイマーのカウントがゼロになったらdisplayResultを実行
    displayKeisan() {
        console.log(`level:${this.gameSetting.level}`);
        this.gameSetting.time = 120;
        this.setTime();
        const html = `
            <div class="top">
                <div class="timer str" id="keisanTimer">${this.gameSetting.set}</div>
                <div class="correctCount str">正答数:${this.gameSetting.correct}</div>
            </div>
            <div class="action mondaiArea">
                <div class="mondai" id="keisanShiki"></div>
                <input type="number" class="input" id="inputBox" placeholder="ここに入力">
                <button class="leftBtn">やめる</button>
            </div>
        `;
            
        const parentElm = document.createElement('div');
        parentElm.innerHTML = html;

        
        //enterを押したときの処理
        const inputElm = parentElm.querySelector('.input');
        inputElm.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                this.gameSetting.inputAns = Number(inputElm.value);
                inputElm.value = '';
                this.keisanCheck();//解答チェック
            }
        });

        const leftBtnElm = parentElm.querySelector('.leftBtn');
        leftBtnElm.addEventListener('click', () => {
            this.clearTimer();
            this.rank();
            this.displayResult();
        });
        
        this.replaceView(parentElm);
        inputElm.focus();
        this.displayMondai();//問題表示
        this.countDownTimer(() => {
            this.rank();
            this.displayResult();
        },'FINISH!');
    }

    //問題を表示する
    displayMondai() {
        const mondaiElm = this.rootElm.querySelector('.mondai');
        // ランダムな数値num1とnum2とそれらを足し合わせたanswerを格納
        this.gameSetting.num1 = this.createNum();
        this.gameSetting.num2 = this.createNum();
        this.gameSetting.answer = this.gameSetting.num1 + this.gameSetting.num2;

        console.log(this.gameSetting.num1,this.gameSetting.num2);
        mondaiElm.innerHTML = `${this.gameSetting.num1} + ${this.gameSetting.num2} = ?`;//画面に表示
        console.log(`answer: ${this.gameSetting.answer}`);//テスト用(ズル)
    }
    
    // リザルト画面を表示 ボタンを押してタイトルへ
    displayResult() {
        //正解数が最高正解数を超えていた場合new recordと表示し数値を更新する。
        if (this.gameSetting.correct > this.gameSetting.highScore){
            localStorage.setItem('score',this.gameSetting.correct);
            this.gameSetting.highScore = this.gameSetting.correct;
            this.gameSetting.newRecord = true;
        }
        const html = `
        <div class="action">
            <p class="str">リザルト</p>
            <p class="rank str ${this.gameSetting.rankClass}">
                ${this.gameSetting.resultRank}
            </p>
            <p class="str">正答数：${this.gameSetting.correct}</p>
            ${this.gameSetting.newRecord
                ? '<p class="str">NEW RECORD!</p>'
                : ''
            }
            <button class="endBtn">タイトルへ</button>
        </div>
        `;
        const parentElm = document.createElement('div');
        parentElm.innerHTML = html;

        const endBtnElm = parentElm.querySelector('.endBtn');
        endBtnElm.addEventListener('click', () => {
            this.displayTitle();//タイトル画面を表示
        });

        this.replaceView(parentElm);
    }

    //タイマーを画面に表示する
    displayTime() {
        const timerElm = this.rootElm.querySelector('.timer');
        this.setTime();
        timerElm.innerText = this.gameSetting.set;
    }

    //カウントダウン終了時に表示させたい文字列を表示する
    displayStr(disp) {
        const html = `
            <p class="timer str">${disp}</p>
        `;
        const parentElm = document.createElement('div');
        parentElm.innerHTML = html;

        this.replaceView(parentElm);
    }

    //htmlの読み込み
    replaceView(elm) {
        this.rootElm.innerHTML = '';
        this.rootElm.appendChild(elm);
    }
//////////////////////////////////////////////////////////////////////////////

}

//クラス実行
new Keisan(document.getElementById('keisanArea')).init();