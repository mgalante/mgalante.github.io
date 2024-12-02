const COUNT_PLAYERS = 4;
const PLAYER_INDEXES = Array.from({ length: COUNT_PLAYERS }, (_, i) => i);
const MINUTES = 60000;

function getInitialState(limitTime) {
  return {
    timerRegistry: [],
    limitTime,
  };
}

function formatMilliseconds(ms) {
  const minutes = Math.floor(ms / MINUTES);
  const seconds = Math.floor((ms % MINUTES) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

function getTimerItem(timeStamp, player, eventType) {
  return {
    timeStamp,
    player,
    eventType,
  };
}

function getCurrentPlayer(state) {
  return state.timerRegistry[state.timerRegistry.length - 1]?.player;
}

function setLimitTime(state, limitTime) {
  return { ...state, limitTime };
}

function validateEndTurn(state, player) {
  return getCurrentPlayer(state) === player;
}

function switchTurn(state, currentTime) {
  const newState = { ...state };
  newState.timerRegistry = [...state.timerRegistry];
  const currentPlayer = getCurrentPlayer(state);
  const nextPlayer = (currentPlayer + 1) % COUNT_PLAYERS;
  newState.timerRegistry.push(getTimerItem(currentTime, currentPlayer, "end"));
  newState.timerRegistry.push(getTimerItem(currentTime, nextPlayer, "start"));
  return newState;
}

function pauseTimer(state, currentTime) {
  const newState = { ...state };
  newState.timerRegistry = [...state.timerRegistry];
  const currentPlayer = getCurrentPlayer(state);
  newState.timerRegistry.push(
    getTimerItem(currentTime, currentPlayer, "pause")
  );
  return newState;
}

function resumeTimer(state, currentTime) {
  const newState = { ...state };
  newState.timerRegistry = [...state.timerRegistry];
  const currentPlayer = getCurrentPlayer(state);
  newState.timerRegistry.push(
    getTimerItem(currentTime, currentPlayer, "resume")
  );
  return newState;
}

function calculateRemainingTime(state, player, currentTime) {
  const playerEvents = state.timerRegistry.filter(
    (item) => item.player === player
  );
  let totalTime = 0;
  const { limitTime } = state;
  for (let i = 0; i < playerEvents.length; i += 2) {
    const startEvent = playerEvents[i];
    const endEvent = playerEvents[i + 1] || { timeStamp: currentTime };
    totalTime += endEvent.timeStamp - startEvent.timeStamp;
  }
  return  limitTime - totalTime;
}

function getTimerState(state) {
  return state.timerRegistry.length ? "running" : "stopped";
}

// ------------------------------

let currentState = 
localStorage.getItem("state") ? JSON.parse(localStorage.getItem("state")) :
{
  timerRegistry: [],
  limitTime: 10 * 60 * 1000,
};

function updateState(newState) {
  localStorage.setItem("state", JSON.stringify(newState));
  currentState = newState;
  updateScreen(currentState);
}

function getLastEventType(state) {
  return state.timerRegistry[state.timerRegistry.length - 1]?.eventType;
}
// ------------------------------

document.getElementById("start").addEventListener("click", () => {
  if (getLastEventType(currentState) === "pause") {
    updateState(resumeTimer(currentState, Date.now()));
  } else {
    const newState = getInitialState(currentState.limitTime);
    newState.timerRegistry.push(getTimerItem(Date.now(), 0, "start"));
    updateState(newState);
  }
});

document.getElementById("pause").addEventListener("click", () => {
  updateState(pauseTimer(currentState, Date.now()));
});

document.getElementById("stop").addEventListener("click", () => {
  updateState(getInitialState(currentState.limitTime));
});

document.getElementById("add-1").addEventListener("click", () => {
  updateState(setLimitTime(currentState, currentState.limitTime + MINUTES));
});

document.getElementById("remove-1").addEventListener("click", () => {
  if(currentState.limitTime >= MINUTES){
    updateState(setLimitTime(currentState, currentState.limitTime - MINUTES));
  }
});

document.querySelectorAll(".grid-item").forEach((item) => {
  item.addEventListener("click", (e) => {
    const player = Number(e.target.id.split("-")[1]);
    if (validateEndTurn(currentState, player)) {
      updateState(switchTurn(currentState, Date.now()));
    }
  });
});

function updateScreen(state) {
  const armyDivs = PLAYER_INDEXES.map((i) =>
    document.getElementById(`army-${i}`)
  );

  armyDivs.forEach((div, i) => {
    const remmainigTime = calculateRemainingTime(state, i, Date.now());
    
    const time = formatMilliseconds(
      Math.abs(remmainigTime)
    );
    if(remmainigTime < 0){
      div.classList.add("overtime");
    }
    else{
      div.classList.remove("overtime");
    }
    div.innerText = time;
  });

  const container = document.querySelector(".grid-container");
  if (getCurrentPlayer(state) !== undefined) {
    container.setAttribute("active-army", `army-${getCurrentPlayer(state)}`);
  } else {
    container.removeAttribute("active-army", `army-${getCurrentPlayer(state)}`);
  }

  if (currentState.timerRegistry.length === 0) {
    document.getElementById("start").disabled = false;
    document.getElementById("stop").disabled = true;
  } else {
    document.getElementById("start").disabled = true;
    document.getElementById("stop").disabled = false;
  }

  if (getLastEventType(state) === "pause") {
    document.getElementById("pause").disabled = true;
    document.getElementById("start").disabled = false;
    document.getElementById("overlay").style.display = "block";
  } else if (
    getLastEventType(state) === "resume" ||
    getLastEventType(state) === "start"
  ) {
    document.getElementById("pause").disabled = false;
    document.getElementById("overlay").style.display = "none";
  } else {
    document.getElementById("pause").disabled = true;
    document.getElementById("overlay").style.display = "block";
  }

  document.getElementById("duration").innerText = formatMilliseconds(
    currentState.limitTime
  );
}

setInterval(() => {
  updateScreen(currentState);
}, 1000);
updateScreen(currentState);
