* {
    box-sizing: border-box;
}

html,
body {
    width: 100%;
    height: 100%;
    margin: 0;
    overflow: hidden;
    font-family: Arial, Helvetica, sans-serif;
    background: #05070a;
}

canvas {
    display: block;
}

#menu {
    position: fixed;
    inset: 0;
    z-index: 100;

    display: flex;
    align-items: center;
    justify-content: center;

    background:
        linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.8)),
        linear-gradient(135deg, #1c78b8, #193e55, #122015);
}

.menu-caixa {
    width: min(90%, 430px);
    padding: 30px;

    color: white;
    text-align: center;

    background: rgba(8, 12, 18, 0.9);

    border: 2px solid rgba(255, 255, 255, 0.15);
    border-radius: 18px;

    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}

.menu-caixa h1 {
    margin: 0 0 10px;
    font-size: 42px;
    text-shadow: 3px 3px 0 black;
}

.menu-caixa p {
    color: #b9c9d8;
}

.menu-caixa input,
.menu-caixa button {
    width: 100%;
    min-height: 48px;
    margin-top: 11px;

    border: 0;
    border-radius: 9px;

    font-size: 16px;
}

.menu-caixa input {
    padding: 0 14px;
}

.menu-caixa button {
    color: white;
    font-weight: bold;
    cursor: pointer;

    background: #238636;
}

#continuarBtn {
    background: #1f6feb;
}

#apagarBtn {
    background: #b52c2c;
}

.menu-caixa button:hover {
    filter: brightness(1.2);
    transform: translateY(-1px);
}

.menu-caixa small {
    display: block;
    margin-top: 18px;

    color: #a8b3be;
    line-height: 1.5;
}

#hud {
    position: fixed;
    z-index: 20;

    top: 0;
    left: 0;

    width: 100%;
    padding: 15px 20px;

    display: flex;
    justify-content: space-between;

    color: white;

    background:
        linear-gradient(
            rgba(0, 0, 0, 0.85),
            rgba(0, 0, 0, 0.05)
        );

    pointer-events: none;
}

#hud > div {
    display: flex;
    flex-direction: column;
    gap: 7px;
}

.hud-direita {
    text-align: right;
}

#dinheiroHud {
    color: #55e56a;
    font-size: 24px;
}

#missaoHud {
    color: #ffe76b;
}

#controles {
    position: fixed;
    z-index: 20;

    bottom: 15px;
    left: 15px;

    padding: 11px 15px;

    color: white;
    background: rgba(0, 0, 0, 0.65);

    border-radius: 8px;
}

#mensagem {
    position: fixed;
    z-index: 30;

    top: 90px;
    left: 50%;

    transform: translateX(-50%);

    padding: 12px 18px;

    color: white;
    background: rgba(0, 0, 0, 0.82);

    border-radius: 10px;
}

.oculto {
    display: none !important;
}

@media (max-width: 600px) {
    .menu-caixa h1 {
        font-size: 31px;
    }

    #hud {
        font-size: 13px;
    }

    #dinheiroHud {
        font-size: 18px;
    }

    #missaoHud {
        max-width: 180px;
    }

    #controles {
        right: 15px;
        text-align: center;
        font-size: 12px;
    }
}

