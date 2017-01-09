window.addEventListener("load", function(){
	var snake = [],//存放蛇的身体每个格点的坐标，snake.length即为蛇的长度
		block = [],//存放block的信息，游戏时block的数量上限为5，当数量超过5后自动清空第一个的block
		gridElems = [],//二维数组，存放网格的每个单元格位置信息gridElems[i][j]确定唯一的单元格位置
		carrier = [],//二维数组，存放着当前网格中所有的非空位置，如果carrier[i][j] !== undefined，说明该格点已被占据
		length = 2,//蛇的长度
		blockLength = 0,//block的个数
		allowPress = true,//只有当allowPress为true时，方向键才能控制蛇的走向，目的是为了防止连续按键太快导致的程序错误
		scoreValue = 0,//得分
		directKey = 39,//方向键
		snakeTimer = null,//蛇移动时的定时器
		brakeTimer = null,//刹车定时器
		skateTimer = null,//加速定时器
		blockTimer = null,//障碍物定时器
		intervalTime = 500,//蛇移动定时器的间隔时间(蛇运动的速度)
		gamePause = false;

	var oSay = document.getElementById("say");
	var oScore = document.getElementById("score");
	var btnStart = document.getElementById("btnStart");
	var btnStop = document.getElementById("btnStop");
	var btnContinue = document.getElementById("btnContinue");


	//生成一个m*n的二维数组
	function multiArray(m, n) {
		var arr = new Array(m);
		for(var i = 0; i < n; i++) {
			arr[i] = new Array(n);
		}
		return arr;
	}

	//随机确定一个单元格
	function randomPointer(startX, startY, endX, endY) {
	    //如果函数没有传递参数，则参数为undefined，此时就取默认值，否则为本身。   
	    var start_x = startX || 0;
	    var start_y = startY || 0;
	    var end_x = endX || 20;
	    var end_y = endY || 20;
	    
	    var arr = [],
	        //这里没有加1，因为数组本来就是从0开始的。
	        x = Math.floor(Math.random()*(end_x - start_x)) + start_x,
	        y = Math.floor(Math.random()*(end_y - start_y)) + start_y;       
	    //如果产生的随机点与网格中已经存在的点正好重合，则重新产生。
	    if(carrier[x][y] !== undefined) return randomPointer(start_x,start_y,end_x,end_y);    
	    arr[0] = x;
	    arr[1] = y;
	    return arr;    
	}

	function random(start, end) {
		return Math.floor(Math.random() * (end - start + 1) + start);
	}


	function initGrid() {
		gridElems = multiArray(20, 20);
		var snakeWrap = document.getElementById("snakeWrap");
	    var table = document.createElement("table"),
	        tbody = document.createElement("tbody")
	    for(var i = 0; i < 20; i++) {  
	        var row = document.createElement("tr");  
	        for(var j = 0; j < 20; j++) {  
	            var col = document.createElement("td");
	            gridElems[j][i] = row.appendChild(col);//二维数组里面都存着所有单元格位置信息 
	        }
	        tbody.appendChild(row);  
	    }
	    table.appendChild(tbody);
	    snakeWrap.appendChild(table);
	}

	//清空单元格画面，定时器，初始化变量
	function clear() {				
		//清空单元格画面
		for(var i = 0; i < 20; i++) {
			for(var j = 0; j < 20; j++) {
				gridElems[i][j].className = "";
			}
		}
		//清空定时器
		clearInterval(snakeTimer);
		clearInterval(brakeTimer);
		clearInterval(skateTimer);
		clearInterval(blockTimer);
		//重新初始化变量
		carrier = multiArray(20, 20);
		snake = [];
		intervalTime = 500;
		length = 2;
		scoreValue = 0;
		oScore.innerHTML = 0;
		btnStart.value = "开始游戏";
	}	

	function initSnake() {
		directKey = 39;
		var pointer = randomPointer(1, 0, 6, 20);
		var x, y;
		for(var i = 0; i < 2; i++) {
			x = pointer[0] - i;
			y = pointer[1];
			snake.push([x,y]);
			gridElems[x][y].className = "cover";
			carrier[x][y] = "cover";
		}
		addObject("food");
	}

	function addObject(sth) {
		var pointer = randomPointer();
		gridElems[pointer[0]][pointer[1]].className = sth;
		carrier[pointer[0]][pointer[1]] = sth;
		if(sth === "block" && blockLength <= 4) {
			block.push([pointer[0],pointer[1]]);
			blockLength++;
		} else if(sth === "block" && blockLength > 4) {
			block.push([pointer[0],pointer[1]]);
			var firstX = block[0][0];
			var firstY = block[0][1];
			gridElems[firstX][firstY].className = "";
			carrier[firstX][firstY] = undefined;
			block.shift()
		}
	}

	function createTimer(sth) {
		switch(sth) {
			case "block":
				clearInterval(blockTimer);
				blockTimer = setInterval(function() {
					addObject("block");
				}, random(5000, 100000));
				break;
			case "brake":
				clearInterval(brakeTimer);
				brakeTimer = setInterval(function() {
					addObject("brake");
				}, random(5000, 100000));
				break;
			case "skate":
				clearInterval(skateTimer);
				skateTimer = setInterval(function() {
					addObject("skate");
				}, random(5000, 100000));
				break;
		}
	}

	function walk() {
	    clearInterval(snakeTimer);
	    snakeTimer = setInterval(step, intervalTime);   
	}

	function step() {
	    //获取目标点
	    var headX = snake[0][0],
	        headY = snake[0][1];
	        lastX = snake[length - 1][0];
	        lastY = snake[length - 1][1];
	    switch(directKey) {
	        case 37: headX -= 1; break;
	        case 38: headY -= 1; break;
	        case 39: headX += 1; break;
	        case 40: headY += 1; break;
	        //向右是x轴，向下是y轴
	    }
	    if(headX >= 20 || headX < 0 || headY >= 20 || headY < 0 || carrier[headX][headY] == "block" || carrier[headX][headY] == "cover" ) {
	        clearInterval(snakeTimer);
	        clearInterval(brakeTimer);
	        clearInterval(skateTimer);
	        clearInterval(blockTimer); 
	        oSay.innerHTML = "你已阵亡";
	        btnStart.value = "重新开始";

	        /*localStorage测试的时候需要将文件上传到服务器或者localhost上——————针对IE和firefox，chrome不需要*/
	    	if(localStorage.getItem("highestCore") === null) {
	    		localStorage.setItem("highestCore", scoreValue);
	    	} else if(scoreValue > localStorage.getItem("highestCore")) {
	    		localStorage.setItem("highestCore", scoreValue);
	    		alert("恭喜你，创造新的纪录了，最高分为" + scoreValue +"分！！");
	    	}	    
	    }


	    else {
	        switch(carrier[headX][headY]) {
	            case "food":
	                snake.unshift([headX,headY]);
	                carrier[headX][headY] = "cover";
	                gridElems[headX][headY].className = "cover";
	                length ++;
	                scoreValue += 10;
	                oScore.innerHTML = scoreValue; 
	                addObject("food");
	                if(intervalTime > 50) intervalTime -= 20;               
	                oSay.innerHTML = "吃到食物";
	                walk();                
	                break;
	            case "skate":
	                if(intervalTime > 100) intervalTime -= 100;
	                snake.unshift([headX,headY]);
	                carrier[headX][headY] = "cover";
	                gridElems[headX][headY].className = "cover"; 
	                carrier[lastX][lastY] = undefined;
	                gridElems[lastX][lastY].className = "";
	                snake.pop();
	                oSay.innerHTML = "担心！要加速了！！"; 
	                walk();               
	                break;  
	            case "brake":
	                intervalTime += 50;
	                snake.unshift([headX,headY]);
	                carrier[headX][headY] = "cover";
	                gridElems[headX][headY].className = "cover"; 
	                carrier[lastX][lastY] = undefined;
	                gridElems[lastX][lastY].className = "";
	                snake.pop(); 
	                oSay.innerHTML = "恭喜你，捡到了一个刹车";
	                walk(); 
	                break;  
	            default:
	                snake.unshift([headX,headY]);
	                carrier[headX][headY] = "cover";
	                gridElems[headX][headY].className = "cover"; 
	                carrier[lastX][lastY] = undefined;
	                gridElems[lastX][lastY].className = "";
	                snake.pop();
	                oSay.innerHTML = "贪吃蛇"; 
	                break;
	        }
	    }
	    allowPress = true;    
	}


	/*--------------以下是运行的代码---------------------*/
	
	//初始化网格
	initGrid();

	//给开始按钮添加点击事件
	btnStart.addEventListener("click", function() {
		clear();//初始化变量、清空单元格信息、消除定时器
		initSnake();//蛇的初始化操作
		walk();//开启蛇行走定时器
		
		//开启block、brake和skate三个定时器
		createTimer("block");
		createTimer("brake");
		createTimer("skate");
		
		//添加键盘事件
		document.addEventListener("keydown", function(event) {
			var keyCode = event.keyCode;
            if(Math.abs(directKey - keyCode) !== 2 && allowPress === true) {
                directKey = keyCode;
                allowPress = false;
            }
		}, false);
	}, false);

	//给暂停按钮添加点击事件
	btnStop.addEventListener("click", function() {
		if(oSay.innerHTML !== "你已阵亡") {
			//消除所有定时器		
			clearInterval(snakeTimer);
			clearInterval(blockTimer);
			clearInterval(skateTimer);
			clearInterval(brakeTimer);
			gamePause = true;
		}
	}, false);

	//给继续按钮添加点击事件
	btnContinue.addEventListener("click", function() {
		if(gamePause) {
			//添加定时器
			createTimer("block");
			createTimer("skate");
			createTimer("brake");
			walk();
		}
		gamePause = false;
	}, false);

}, false);

