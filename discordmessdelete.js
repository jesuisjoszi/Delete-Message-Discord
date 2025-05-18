// ==UserScript==
// @name         Salvation
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  delete messages from dm/server inspired by undiscord
// @author       Joszza
// @match        https://discord.com/channels/*
// @grant        none
// ==/UserScript==


(function() {
    'use strict';

    // === STAŁE / CONSTANTS ===
    /**
     * Opóźnienie pomiędzy kasowaniem kolejnych wiadomości (ms)
     * Delay between deleting consecutive messages (ms)
     */
    const DELETE_MESSAGE_DELAY = 2500; // ms (2.5 seconds)
    /**
     * Opóźnienie pomiędzy pobieraniem kolejnych stron wiadomości (ms)
     * Delay between fetching next page of messages (ms)
     */
    const SEARCH_PAGE_DELAY = 30000; // ms (30 seconds)

    const style = document.createElement('style');
    style.textContent = `
    .salvation-root {
        position: fixed;
        margin: 40px auto;
        left: 0; right: 0;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        background: #18191c;
        color: #fff;
        border-radius: 12px;
        box-shadow: 0 8px 32px #000b;
        min-width: 800px;
        max-width: 98vw;
        min-height: 480px;
        font-family: 'gg sans', 'Segoe UI', sans-serif;
        overflow: hidden;
        border: 2px solid #111214;
        width: 1100px;
        height: 600px;
        max-height: 90vh;
    }
    .salvation-content-row {
        display: flex;
        flex-direction: row;
        width: 100%;
        height: 100%;
        min-height: 0;
        min-width: 0;
    }
    .salvation-sidebar {
        width: 380px !important;
        min-width: 380px;
        max-width: 400px;
        padding: 18px 24px 14px 24px !important;
        background: #23272a;
        display: flex;
        flex-direction: column;
        border-right: 2px solid #18191c;
        box-shadow: 2px 0 16px #0003;
        gap: 7px;
        overflow-y: auto;
        overflow-x: hidden;
        max-height: 100%;
        scrollbar-width: thin;
        scrollbar-color: #23272a #18191c;
    }
    .salvation-sidebar * {
        max-width: 100%;
        box-sizing: border-box;
    }
    .salvation-sidebar fieldset {
        min-width: 0;
        background: #18191c;
        border: 1.5px solid #23272a;
        border-radius: 8px;
        padding: 12px 14px 10px 14px;
        margin-bottom: 10px;
    }
    .salvation-sidebar fieldset:last-of-type {
        margin-bottom: 0;
    }
    .salvation-sidebar .salvation-btn {
        max-width: 100%;
        background: #23272a !important;
        color: #fff !important;
        border: 1.5px solid #36393f !important;
        border-radius: 6px !important;
        box-shadow: none !important;
        font-size: 15px;
        font-weight: 700;
        padding: 10px 0;
        min-width: 70px;
        margin-left: 10px;
        transition: background 0.2s, box-shadow 0.2s, filter 0.2s;
        width: 160px;
    }
    .salvation-sidebar .salvation-btn.danger {
        background: #f04747 !important;
        color: #fff !important;
        border: none !important;
    }
    .salvation-sidebar .salvation-btn:hover {
        filter: brightness(1.13) drop-shadow(0 2px 8px #5865f2aa);
        background: #18191c !important;
    }
    .salvation-sidebar .salvation-input {
        background: #18191c;
        color: #fff;
        border: 1.5px solid #23272a;
        border-radius: 7px;
        padding: 10px 14px;
        width: 100%;
        font-size: 15px;
        margin-bottom: 0;
        box-sizing: border-box;
        transition: border 0.2s, box-shadow 0.2s;
        outline: none;
    }
    .salvation-sidebar .salvation-input:focus {
        border: 1.5px solid #5865f2;
        box-shadow: 0 0 0 2px #5865f255;
    }
    .salvation-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: #18191c;
        min-width: 0;
        padding: 0 24px 0 24px;
    }
    .salvation-header {
        height: 56px; background: #23272a; display: flex; align-items: center; padding: 0 24px;
        font-size: 20px; font-weight: 700; color: #fff; border-bottom: 2px solid #18191c;
        letter-spacing: 0.5px;
        width: 100%;
        min-width: 0;
        border-top-left-radius: 12px;
        border-top-right-radius: 12px;
    }
    .salvation-toolbar {
        display: flex;
        gap: 8px;
        align-items: center;
        justify-content: center;
        padding: 12px 18px;
        background: #18191c;
        border-bottom: 1.5px solid #23272a;
        flex-wrap: wrap;
    }
    .salvation-toolbar .salvation-btn {
        background: #23272a !important;
        color: #fff !important;
        border: 1.5px solid #36393f !important;
        font-size: 13px;
        font-weight: 600;
        border-radius: 6px !important;
        box-shadow: none !important;
        transition: filter 0.2s, box-shadow 0.2s;
        min-width: 80px;
        padding: 0 18px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
        margin: 0;
    }
    .salvation-toolbar .salvation-btn:not(:first-child) {
        margin-left: 8px;
    }
    .salvation-toolbar .salvation-btn#salvation-delete {
        background: linear-gradient(90deg,#f04747 70%,#d32f2f 100%) !important;
        color: #fff !important;
        border: none !important;
        font-size: 13px;
        font-weight: 700;
        box-shadow: 0 2px 8px #f0474722;
        transition: filter 0.2s, box-shadow 0.2s;
    }
    .salvation-toolbar .salvation-btn#salvation-delete:hover {
        filter: brightness(1.08) drop-shadow(0 2px 8px #f04747aa);
    }
    .salvation-toolbar .salvation-btn#salvation-clear {
        background: #23272a !important;
        color: #ffe066 !important;
        border: 1.5px solid #ffe066 !important;
    }
    .salvation-toolbar .salvation-btn#salvation-clear:hover {
        filter: brightness(1.13) drop-shadow(0 2px 8px #ffe06655);
    }
    .salvation-toolbar .salvation-btn#salvation-download {
        background: #23272a !important;
        color: #60a5fa !important;
        border: 1.5px solid #60a5fa !important;
    }
    .salvation-toolbar .salvation-btn#salvation-download:hover {
        filter: brightness(1.13) drop-shadow(0 2px 8px #60a5fa55);
    }
    .salvation-toolbar .salvation-btn#salvation-downloadmsg {
        background: #23272a !important;
        color: #34d399 !important;
        border: 1.5px solid #34d399 !important;
    }
    .salvation-toolbar .salvation-btn#salvation-downloadmsg:hover {
        filter: brightness(1.13) drop-shadow(0 2px 8px #34d39955);
    }
    .salvation-toolbar .salvation-btn#salvation-count {
        background: #23272a !important;
        color: #fbbf24 !important;
        border: 1.5px solid #fbbf24 !important;
    }
    .salvation-toolbar .salvation-btn#salvation-count:hover {
        filter: brightness(1.13) drop-shadow(0 2px 8px #fbbf2455);
    }
    .salvation-toolbar .salvation-btn#salvation-preview {
        background: #23272a !important;
        color: #60a5fa !important;
        border: 1.5px solid #60a5fa !important;
    }
    .salvation-toolbar .salvation-btn#salvation-preview:hover {
        filter: brightness(1.13) drop-shadow(0 2px 8px #60a5fa55);
    }
    .salvation-logarea {
        background: #111214;
        color: #eee;
        border-radius: 7px;
        padding: 18px 24px;
        min-height: 120px;
        max-height: 100%;
        overflow-y: auto;
        font-size: 12px;
        border: 1.5px solid #23272a;
        margin: 18px 0 24px 0;
        flex: 1;
        box-shadow: 0 1px 4px #0002;
        font-family: 'Consolas', 'Liberation Mono', monospace;
        scrollbar-width: thin;
        scrollbar-color: #23272a #18191c;
        user-select: text;
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-word;
        overflow-x: hidden;
        max-width: 100%;
    }
    .salvation-logarea::-webkit-scrollbar {
        width: 8px;
        background: #18191c;
        border-radius: 8px;
    }
    .salvation-logarea::-webkit-scrollbar-thumb {
        background: #23272a;
        border-radius: 8px;
        min-height: 40px;
        transition: background 0.2s;
    }
    .salvation-logarea:hover::-webkit-scrollbar-thumb {
        background: #36393f;
    }
    .salvation-logarea::-webkit-scrollbar-corner {
        background: #18191c;
    }
    .salvation-log-info { color: #60a5fa; }
    .salvation-log-success { color: #34d399; }
    .salvation-log-error { color: #f87171; }
    .salvation-log-warn { color: #fbbf24; }
    .salvation-log-debug { color: #a3a3a3; }
    .salvation-log-time { color: #888; font-size: 10px; margin-right: 4px; }
    .salvation-version { color: #aaa; font-size: 11px; margin-top: 10px; text-align: center; letter-spacing: 0.2px; }
    .salvation-sidebar legend {
        font-size: 16px;
        font-weight: 700;
        color: #fff;
        letter-spacing: 0.5px;
        margin-bottom: 10px;
        padding: 0 6px;
        background: none;
    }
    .salvation-sidebar label.salvation-label {
        font-size: 14px;
        color: #b9bbbe;
        margin-bottom: 7px;
        font-weight: 600;
        letter-spacing: 0.1px;
    }
    .salvation-sidebar input[type="checkbox"] {
        accent-color: #5865f2;
        width: 18px;
        height: 18px;
        margin-right: 6px;
    }
    .salvation-sidebar .salvation-label + div,
    .salvation-sidebar .salvation-input + div {
        margin-top: 6px;
    }
    .salvation-sidebar .salvation-input[type="datetime-local"] {
        padding: 10px 14px;
        font-size: 15px;
        background: #18191c;
        color: #fff;
        border: 1.5px solid #23272a;
    }
    .salvation-sidebar .salvation-input[type="datetime-local"]:focus {
        border: 1.5px solid #5865f2;
        box-shadow: 0 0 0 2px #5865f255;
    }
    .salvation-sidebar hr {
        border: none;
        border-bottom: 1.5px solid #23272a;
        margin: 18px 0 18px 0;
    }
    #salvation-autoscroll-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin: 12px 0 0 0;
        flex-wrap: wrap;
    }
    #salvation-autoscroll-wrap label {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 13px;
        color: #d1d5db;
        font-weight: 600;
        background: #18191c;
        border-radius: 6px;
        padding: 4px 10px 4px 8px;
        transition: background 0.18s, color 0.18s;
        cursor: pointer;
        user-select: none;
    }
    #salvation-autoscroll-wrap label:hover {
        background: #23272a;
        color: #fff;
    }
    #salvation-autoscroll-wrap input[type="checkbox"] {
        accent-color: #5865f2;
        width: 20px;
        height: 20px;
        border-radius: 5px;
        border: 2px solid #36393f;
        background: #23272a;
        transition: box-shadow 0.18s, border 0.18s;
        margin: 0 4px 0 0;
        cursor: pointer;
    }
    #salvation-autoscroll-wrap input[type="checkbox"]:hover {
        box-shadow: 0 0 0 2px #5865f288;
        border: 2px solid #5865f2;
    }
    .salvation-filter-row {
        display: flex;
        gap: 14px;
        align-items: center;
        margin-top: 4px;
        margin-bottom: 2px;
    }
    .salvation-filter-row label {
        display: flex;
        align-items: center;
        gap: 7px;
        font-size: 15px;
        color: #d1d5db;
        font-weight: 600;
        background: #18191c;
        border-radius: 6px;
        padding: 4px 10px 4px 7px;
        transition: background 0.18s, color 0.18s;
        cursor: pointer;
        user-select: none;
    }
    .salvation-filter-row label:hover {
        background: #23272a;
        color: #fff;
    }
    .salvation-filter-row input[type="checkbox"] {
        accent-color: #5865f2;
        width: 20px;
        height: 20px;
        border-radius: 5px;
        border: 2px solid #36393f;
        background: #23272a;
        transition: box-shadow 0.18s, border 0.18s;
        margin: 0 4px 0 0;
        cursor: pointer;
    }
    .salvation-filter-row input[type="checkbox"]:hover {
        box-shadow: 0 0 0 2px #5865f288;
        border: 2px solid #5865f2;
    }
    .salvation-progressbar {
        width: 100%;
        min-width: 0;
        max-width: 100%;
        margin: 0 0 10px 0;
        height: 20px;
        background: #23272a;
        border-radius: 0 0 8px 8px;
        box-shadow: 0 2px 8px #5865f255;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .salvation-progressbar-inner {
        height: 100%;
        background: linear-gradient(90deg, #5865f2 70%, #5865f2cc 100%);
        border-radius: 8px;
        transition: width 0.25s cubic-bezier(.4,2,.6,1);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 700;
        font-size: 15px;
        letter-spacing: 0.5px;
        text-shadow: 0 1px 4px #000a;
        min-width: 40px;
        white-space: nowrap;
        text-align: center;
        padding: 0 8px;
    }
    #salvation-preview-modal .preview-chat-container {
        max-width: 700px;
        margin: 0 auto;
        background: #23272a;
        border-radius: 16px;
        box-shadow: 0 8px 32px #000a;
        padding: 0;
        overflow-x: hidden;
        width: 100%;
    }
    #salvation-preview-modal .preview-msg {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        padding: 18px 0 10px 0;
        border-bottom: 1px solid #36393f;
        max-width: 100%;
        overflow-x: hidden;
    }
    #salvation-preview-modal .preview-msg-avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #18191c;
        object-fit: cover;
        flex-shrink: 0;
    }
    #salvation-preview-modal .preview-msg-main {
        flex: 1;
        min-width: 0;
        max-width: 100%;
        overflow-x: hidden;
    }
    #salvation-preview-modal .preview-msg-header {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        max-width: 100%;
        overflow-x: hidden;
        margin-bottom: 2px;
    }
    #salvation-preview-modal .preview-msg-header span {
        min-width: 0;
        max-width: 100%;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    #salvation-preview-modal .preview-msg-author {
        font-weight: 700;
        color: #00b0f4;
        font-size: 17px;
        min-width: 0;
        max-width: 100%;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    #salvation-preview-modal .preview-msg-id,
    #salvation-preview-modal .preview-msg-msgid {
        color: #aaa;
        font-size: 12px;
        margin-left: 8px;
        min-width: 0;
        max-width: 100%;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    #salvation-preview-modal .preview-msg-time {
        color: #aaa;
        font-size: 12px;
        margin-left: 8px;
        min-width: 0;
        max-width: 100%;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    #salvation-preview-modal .preview-msg-content {
        margin-top: 2px;
        white-space: pre-wrap;
        word-break: break-word;
        font-size: 16px;
        line-height: 1.5;
        max-width: 100%;
        overflow-x: hidden;
    }
    #salvation-preview-modal .preview-msg-embed {
        background: #23272a;
        padding: 6px 10px;
        border-radius: 6px;
        margin-top: 6px;
        color: #43b581;
        font-size: 13px;
        max-width: 100%;
        overflow-x: hidden;
        word-break: break-word;
    }
    #salvation-preview-modal .preview-msg-attach {
        color: #faa61a;
        font-size: 13px;
        display: block;
        margin-top: 6px;
        max-width: 100%;
        word-break: break-all;
        overflow-x: hidden;
    }
    #salvation-preview-modal img {
        max-width: 100%;
        height: auto;
        border-radius: 6px;
        margin-top: 4px;
        display: block;
    }
    #salvation-logfilter-bar label {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 13px;
        color: #d1d5db;
        font-weight: 600;
        background: #18191c;
        border-radius: 6px;
        padding: 4px 10px 4px 8px;
        transition: background 0.18s, color 0.18s;
        cursor: pointer;
        user-select: none;
    }
    #salvation-logfilter-bar label:hover {
        background: #23272a;
        color: #fff;
    }
    #salvation-logfilter-bar input[type="checkbox"] {
        accent-color: #5865f2;
        width: 18px;
        height: 18px;
        margin-right: 6px;
        border-radius: 5px;
        border: 2px solid #36393f;
        background: #23272a;
        transition: box-shadow 0.18s, border 0.18s;
        cursor: pointer;
    }
    #salvation-logfilter-bar input[type="checkbox"]:hover {
        box-shadow: 0 0 0 2px #5865f288;
        border: 2px solid #5865f2;
    }
    #salvation-logfilter-bar {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 6px;
        margin-top: 10px;
        justify-content: center;
    }
    #salvation-logfilter-bar input[type="text"] {
        font-size: 13px;
        padding: 4px 10px;
        border-radius: 6px;
        border: 1.5px solid #23272a;
        background: #18191c;
        color: #fff;
        outline: none;
        min-width: 120px;
        flex: 1;
        margin-left: 10px;
    }
    `;
    document.head.appendChild(style);

    const styleCustomCheckbox = document.createElement('style');
    styleCustomCheckbox.textContent = `
      .salvation-checkbox-label {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 13px;
        color: #d1d5db;
        font-weight: 600;
        background: #18191c;
        border-radius: 6px;
        padding: 4px 10px 4px 8px;
        transition: background 0.18s, color 0.18s;
        cursor: pointer;
        user-select: none;
        margin: 0;
      }
      .salvation-checkbox-label:hover {
        background: #23272a;
        color: #fff;
      }
      .salvation-checkbox {
        accent-color: #5865f2;
        width: 16px;
        height: 16px;
        border-radius: 5px;
        border: 2px solid #36393f;
        background: #23272a;
        transition: box-shadow 0.18s, border 0.18s;
        margin: 0 4px 0 0;
        cursor: pointer;
      }
      .salvation-checkbox:hover {
        box-shadow: 0 0 0 2px #5865f288;
        border: 2px solid #5865f2;
      }
    `;
    document.head.appendChild(styleCustomCheckbox);


    function createDiscordLikeGUI() {
        if (document.querySelector('.salvation-root')) return;
        const root = document.createElement('div');
        root.className = 'salvation-root';
        root.innerHTML = `
            <div class="salvation-header" style="display:flex;align-items:center;justify-content:space-between;">
                <span style="display:flex;align-items:center;gap:16px;">
                    <span style="width:64px;height:64px;display:inline-block;border-radius:50%;background:url(https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExeWNncDZjcWttdmFwc2l0NTQwMmhwaXFsN3Vha3hidGQ4Z3dqMmpqOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/ue7Oh8WdVspgI/giphy.gif) center/contain no-repeat;"></span>
                    Salvation
                </span>
                <div style="display:flex;align-items:center;gap:8px;margin-left:auto;">
                    <button id="salvation-minimize" title="Minimize / Restore" style="background:none;border:none;color:#aaa;font-size:20px;cursor:pointer;padding:0 8px;line-height:1;">&#8211;</button>
                    <button id="salvation-close" title="Close" style="background:none;border:none;color:#aaa;font-size:22px;cursor:pointer;padding:0 8px;line-height:1;">×</button>
            </div>
                            </div>
            <div class="salvation-content-row">
                <div class="salvation-sidebar" style="width:380px;padding:18px 24px 14px 24px;overflow-y:auto;max-height:100%;">
                    <fieldset>
                      <legend>General</legend>
                      <div style="margin-bottom:14px;">
                        <label class="salvation-label">Author ID</label>
                        <div style="display:flex;gap:8px;align-items:center;">
                          <input class="salvation-input" id="salvation-author" type="text" placeholder="Author ID" style="flex:1;">
                          <button class="salvation-btn" id="salvation-me" title="Get Author ID">Get</button>
                            </div>
                      </div>
                      <div style="margin-bottom:14px;">
                        <label class="salvation-label">Server ID</label>
                        <div style="display:flex;gap:8px;align-items:center;">
                          <input class="salvation-input" id="salvation-server" type="text" placeholder="Server ID" style="flex:1;">
                          <button class="salvation-btn" id="salvation-guild" title="Get Server ID">Get</button>
                        </div>
                      </div>
                      <div>
                        <label class="salvation-label">Channel ID</label>
                        <div style="display:flex;gap:8px;align-items:center;">
                          <input class="salvation-input" id="salvation-channel" type="text" placeholder="Channel ID" style="flex:1;">
                          <button class="salvation-btn" id="salvation-channelbtn" title="Get Channel ID">Get</button>
                        </div>
                            </div>
                        </fieldset>
                    <fieldset>
                      <legend>Filters</legend>
                      <div style="margin-bottom:10px;">
                        <label class="salvation-label">Contains text</label>
                        <input class="salvation-input" id="salvation-filter-text" type="text" placeholder="Search in content">
                            </div>
                      <div class="salvation-filter-row">
                        <label><input type="checkbox" id="salvation-haslink"> LINK</label>
                        <label><input type="checkbox" id="salvation-hasfile"> FILE</label>
                        <label><input type="checkbox" id="salvation-pinned"> PINNED</label>
                            </div>
                      <div style="margin-bottom:10px;">
                        <label class="salvation-label">Regex (content)</label>
                        <input class="salvation-input" id="salvation-filter-regex" type="text" placeholder="Regex pattern">
                      </div>
                      <div style="margin-bottom:10px;display:flex;gap:8px;">
                        <div style="flex:1;">
                          <label class="salvation-label">Min length</label>
                          <input class="salvation-input" id="salvation-filter-minlen" type="number" min="0" placeholder="min">
                        </div>
                        <div style="flex:1;">
                          <label class="salvation-label">Max length</label>
                          <input class="salvation-input" id="salvation-filter-maxlen" type="number" min="0" placeholder="max">
                        </div>
                      </div>
                      <div style="margin-bottom:10px;">
                        <label class="salvation-label">Delete limit</label>
                        <input class="salvation-input" id="salvation-delete-limit" type="number" min="1" placeholder="Max messages to delete (empty = all)">
                    </div>
                        </fieldset>
                    <fieldset>
                      <legend>Intervals</legend>
                      <div style="margin-bottom:10px;">
                        <label class="salvation-label">Delete after message ID (DOWN)</label>
                        <div style="display:flex;gap:8px;align-items:center;">
                          <input class="salvation-input" id="salvation-afterid" type="text" placeholder="Delete after message ID (DOWN)">
                          <label for="salvation-afterid-include" class="salvation-checkbox-label"><input type="checkbox" id="salvation-afterid-include" class="salvation-checkbox">Include this message</label>
                        </div>
                    </div>
                      <div style="margin-bottom:10px;">
                        <label class="salvation-label">Delete before message ID (UP)</label>
                        <div style="display:flex;gap:8px;align-items:center;">
                          <input class="salvation-input" id="salvation-beforeid" type="text" placeholder="Delete before message ID (UP)">
                          <label for="salvation-beforeid-include" class="salvation-checkbox-label"><input type="checkbox" id="salvation-beforeid-include" class="salvation-checkbox">Include this message</label>
                        </div>
                </div>
                      <div style="margin-bottom:10px;">
                        <label class="salvation-label">Delete after date (DOWN)</label>
                        <div style="display:flex;gap:8px;align-items:center;">
                          <input class="salvation-input" id="salvation-afterdate" type="datetime-local">
                          <label for="salvation-afterdate-include" class="salvation-checkbox-label"><input type="checkbox" id="salvation-afterdate-include" class="salvation-checkbox">Include this date</label>
                        </div>
                        </div>
                      <div>
                        <label class="salvation-label">Delete before date (UP)</label>
                        <div style="display:flex;gap:8px;align-items:center;">
                          <input class="salvation-input" id="salvation-beforedate" type="datetime-local">
                          <label for="salvation-beforedate-include" class="salvation-checkbox-label"><input type="checkbox" id="salvation-beforedate-include" class="salvation-checkbox">Include this date</label>
                        </div>
                    </div>
                    </fieldset>
                    <fieldset>
                      <legend>Advanced</legend>
                      <div style="margin-bottom:10px;">
                        <label class="salvation-label">Channel queue (one per line)</label>
                        <textarea class="salvation-input" id="salvation-channel-queue" rows="4" placeholder="Paste Channel IDs, one per line"></textarea>
                        <div id="salvation-channel-queue-list" style="margin-top:8px;"></div>
                        <div style="font-size:12px;color:#aaa;margin-top:4px;">After deleting from the main channel, the script will automatically proceed to the next channels in the list.</div>
                      </div>
                    </fieldset>
                    <hr>
                    <div class="salvation-version" style="font-size:10px;">Salvation 1.0 by joszza</div>
                </div>
                <div class="salvation-main">
                    <div class="salvation-toolbar">
                        <button class="salvation-btn danger" id="salvation-delete">Delete messages</button>
                        <button class="salvation-btn" id="salvation-cancel" style="background:#23272a;color:#f04747;border:1.5px solid #f04747;margin-left:8px;display:none;">Cancel deletion</button>
                        <button class="salvation-btn" id="salvation-clear">Clear log</button>
                        <button class="salvation-btn" id="salvation-download">Download logs</button>
                        <button class="salvation-btn" id="salvation-downloadmsg">Download messages</button>
                        <button class="salvation-btn" id="salvation-count">Check message count</button>
                        <button class="salvation-btn" id="salvation-preview" style="background:#23272a;color:#60a5fa;border:1.5px solid #60a5fa;">Show preview</button>
                    </div>
                    <pre class="salvation-logarea" id="salvation-logarea"></pre>
            </div>
        </div>
        `;
        document.body.appendChild(root);
        makeDraggable(root, root.querySelector('.salvation-header'));
        const minimizeBtn = document.getElementById('salvation-minimize');
        let minimized = false;
        minimizeBtn.onclick = () => {
            minimized = !minimized;
            if (minimized) {
                root.style.width = '220px';
                root.style.height = '48px';
                root.style.minWidth = '0';
                root.style.minHeight = '0';
                root.querySelector('.salvation-sidebar').style.display = 'none';
                root.querySelector('.salvation-main').style.display = 'none';
                if (!document.getElementById('salvation-mini-bar')) {
                    const mini = document.createElement('div');

                    mini.querySelector('#salvation-mini-restore').onclick = (e) => {
                        e.stopPropagation();
                        minimized = false;
                        root.style.width = '';
                        root.style.height = '';
                        root.style.minWidth = '';
                        root.style.minHeight = '';
                        root.querySelector('.salvation-sidebar').style.display = '';
                        root.querySelector('.salvation-main').style.display = '';
                        mini.remove();
                    };
                    let drag = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;
                    mini.addEventListener('mousedown', function(e) {

                        if (e.button !== 0 || e.target.closest('#salvation-mini-restore')) return;
                        drag = true;
                        startX = e.clientX; startY = e.clientY;
                        const rect = root.getBoundingClientRect();
                        startLeft = rect.left; startTop = rect.top;
                        document.body.style.userSelect = 'none';
                    });
                    document.addEventListener('mousemove', function(e) {
                        if (!drag) return;
                        let dx = e.clientX - startX, dy = e.clientY - startY;
                        let newLeft = startLeft + dx, newTop = startTop + dy;
                        const minLeft = 0;
                        const minTop = 0;
                        const maxLeft = window.innerWidth - root.offsetWidth;
                        const maxTop = window.innerHeight - root.offsetHeight;
                        newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
                        newTop = Math.max(minTop, Math.min(newTop, maxTop));
                        root.style.left = newLeft + 'px';
                        root.style.top = newTop + 'px';
                        root.style.right = 'auto';
                    });
                    document.addEventListener('mouseup', function() {
                        if (drag) {
                            drag = false;
                            document.body.style.userSelect = '';
                        }
                    });
                }
            } else {
                root.style.width = '';
                root.style.height = '';
                root.style.minWidth = '';
                root.style.minHeight = '';
                root.querySelector('.salvation-sidebar').style.display = '';
                root.querySelector('.salvation-main').style.display = '';
                const mini = document.getElementById('salvation-mini-bar');
                if (mini) mini.remove();
            }
        };

    }

    function makeDraggable(panel, header) {
        let isDragging = false, startX, startY, startLeft, startTop;
        header.style.cursor = 'move';
        header.addEventListener('mousedown', function(e) {
            if (e.button !== 0) return;
            isDragging = true;
            const rect = panel.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            startLeft = rect.left;
            startTop = rect.top;
            document.body.style.userSelect = 'none';
        });
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            let dx = e.clientX - startX, dy = e.clientY - startY;
            let newLeft = startLeft + dx, newTop = startTop + dy;
            const minLeft = 0;
            const minTop = 0;
            const maxLeft = window.innerWidth - panel.offsetWidth;
            const maxTop = window.innerHeight - panel.offsetHeight;
            newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
            newTop = Math.max(minTop, Math.min(newTop, maxTop));
            panel.style.left = newLeft + 'px';
            panel.style.top = newTop + 'px';
            panel.style.right = 'auto';
        });
        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                document.body.style.userSelect = '';
            }
        });
    }


    let stopDelete = false;
    let isDeleting = false;
    let deleteTask = null;

    function setDeleteButtonState(running) {
        const btn = document.getElementById('salvation-delete');
        if (!btn) return;
        if (running) {
            btn.textContent = 'STOP';
            btn.classList.add('danger');
            btn.style.background = 'linear-gradient(90deg,#f04747 70%,#d32f2f 100%)';
            btn.style.borderRadius = '6px';
        } else {
            btn.textContent = 'Delete messages';
            btn.classList.add('danger');
            btn.style.background = '#f04747';
            btn.style.borderRadius = '6px';
        }
    }

    function showProgressBar(total) {
        let bar = document.getElementById('salvation-progressbar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'salvation-progressbar';
            bar.className = 'salvation-progressbar';
            const inner = document.createElement('div');
            inner.id = 'salvation-progressbar-inner';
            inner.className = 'salvation-progressbar-inner';
            bar.appendChild(inner);
            const toolbar = document.querySelector('.salvation-toolbar');
            if (toolbar && toolbar.parentNode) {
                toolbar.parentNode.insertBefore(bar, toolbar.nextSibling);
            }
        } else {
            bar.style.display = '';
        }
        let info = document.getElementById('salvation-progressbar-info');
        if (!info && bar.parentNode) {
            info = document.createElement('div');
            info.id = 'salvation-progressbar-info';
            info.style = 'margin: 4px 0 12px 0; color: #b9bbbe; font-size: 14px; text-align: center; font-family: inherit;';
            bar.parentNode.insertBefore(info, bar.nextSibling);
        } else if (info) {
            info.style.display = '';
        }
        updateProgressBar(0, total);
    }
    function updateProgressBar(current, total) {
        const inner = document.getElementById('salvation-progressbar-inner');
        if (!inner) return;
        const percent = total ? Math.round((current / total) * 100) : 0;
        let text = `${percent}%  (${current}/${total})`;
        inner.style.width = percent + '%';
        inner.textContent = text;
    }
    function updateProgressBarInfo({etaSec = null, elapsedSec = null, pageCount = null, deleted = null} = {}) {
        const info = document.getElementById('salvation-progressbar-info');
        if (!info) return;
        let etaStr = etaSec !== null ? `ETA: ${formatTime(etaSec)}` : '';
        let elapsedStr = elapsedSec !== null ? `Elapsed: ${formatTime(elapsedSec)}` : '';
        let pageStr = pageCount !== null ? `Pages: ${pageCount}` : '';
        let delStr = deleted !== null ? `Deleted: ${deleted}` : '';
        info.innerHTML = [etaStr, elapsedStr, pageStr, delStr].filter(Boolean).join(' &nbsp;|&nbsp; ');
    }
    function formatTime(sec) {
        sec = Math.round(sec);
        let h = Math.floor(sec / 3600);
        let m = Math.floor((sec % 3600) / 60);
        let s = sec % 60;
        let out = '';
        if (h > 0) out += h + 'h ';
        if (m > 0) out += m + 'min ';
        out += s + 's';
        return out;
    }
    function hideProgressBar() {
        const bar = document.getElementById('salvation-progressbar');
        if (bar) bar.style.display = 'none';
        const info = document.getElementById('salvation-progressbar-info');
        if (info) info.style.display = 'none';
    }
    function filterMessages(messages, filters) {
        let result = messages;
        if (filters.authorId) result = result.filter(m => m.author?.id === filters.authorId);
        if (filters.skipType3) result = result.filter(m => m.type !== 3);
        if (filters.afterId && filters.beforeId) {
            result = result.filter(m => {
                let afterCond = filters.afterIdInclude ? m.id >= filters.afterId : m.id > filters.afterId;
                let beforeCond = filters.beforeIdInclude ? m.id <= filters.beforeId : m.id < filters.beforeId;
                return afterCond && beforeCond;
            });
        } else {
            if (filters.afterId) result = result.filter(m => filters.afterIdInclude ? m.id >= filters.afterId : m.id > filters.afterId);
            if (filters.beforeId) result = result.filter(m => filters.beforeIdInclude ? m.id <= filters.beforeId : m.id < filters.beforeId);
        }
        if (filters.afterDateStr) result = result.filter(m => {
            const msgDate = m.timestamp ? new Date(m.timestamp) : null;
            if (!msgDate) return false;
            return filters.afterDateInclude ? msgDate >= new Date(filters.afterDateStr) : msgDate > new Date(filters.afterDateStr);
        });
        if (filters.beforeDateStr) result = result.filter(m => {
            const msgDate = m.timestamp ? new Date(m.timestamp) : null;
            if (!msgDate) return false;
            return filters.beforeDateInclude ? msgDate <= new Date(filters.beforeDateStr) : msgDate < new Date(filters.beforeDateStr);
        });
        if (filters.filterText) result = result.filter(m => (m.content||'').toLowerCase().includes(filters.filterText.toLowerCase()));
        if (filters.filterHasLink) result = result.filter(m => /https?:\/\//.test(m.content||''));
        if (filters.filterHasFile) result = result.filter(m => Array.isArray(m.attachments) && m.attachments.length > 0);
        if (filters.filterPinned) result = result.filter(m => m.pinned);
        if (filters.regex) {
            let re;
            try { re = new RegExp(filters.regex, 'i'); } catch {}
            if (re) result = result.filter(m => re.test(m.content||''));
        }
        if (filters.minlen) result = result.filter(m => (m.content||'').length >= filters.minlen);
        if (filters.maxlen) result = result.filter(m => (m.content||'').length <= filters.maxlen);
        return result;
    }
    async function deleteAllOwnMessages() {
        stopDelete = false;
        if (deleteTask) {
            deleteTask.cancelled = true;
        }
        deleteTask = { cancelled: false };
        log('---------------------------------', 'debug');
        log('---------- NEW SESSION ----------', 'debug');
        log('---------------------------------', 'debug');
        log(`Delay deleting messages = ${DELETE_MESSAGE_DELAY/1000}s, Delay searching pages = ${SEARCH_PAGE_DELAY/1000}s.`, 'debug');
        setDeleteButtonState(true);
        isDeleting = true;

        const channelIdInput = document.getElementById('salvation-channel').value.trim();
        let queue = [];
        const queueListDiv = document.getElementById('salvation-channel-queue-list');
        if (queueListDiv) {
            const rows = queueListDiv.querySelectorAll('div');
            rows.forEach(row => {
                const input = row.querySelector('input[type="text"]');
                const checkbox = row.querySelector('input[type="checkbox"]');
                if (input && input.value.trim()) {
                    queue.push({ channelId: input.value.trim(), alert: checkbox && checkbox.checked });
                }
            });
        }
        let fullQueue = [];
        if (channelIdInput) fullQueue.push({ channelId: channelIdInput, alert: true }); 
        for (const q of queue) {
            if (q.channelId !== channelIdInput) fullQueue.push(q);
        }
        if (!fullQueue.length) {
            log('Please provide at least one Channel ID in Advanced or General.', 'error');
            setDeleteButtonState(false);
            isDeleting = false;
            return;
        }

        const token = getToken();
        const authorId = document.getElementById('salvation-author').value.trim();
        if (!token || !authorId) {
            log('Please provide Author ID and a valid token.', 'error');
            setDeleteButtonState(false);
            isDeleting = false;
            return;
        }

        let afterId = document.getElementById('salvation-afterid')?.value || '';
        let beforeId = document.getElementById('salvation-beforeid')?.value || '';
        let afterIdInclude = document.getElementById('salvation-afterid-include')?.checked || false;
        let beforeIdInclude = document.getElementById('salvation-beforeid-include')?.checked || false;
        let afterDateStr = document.getElementById('salvation-afterdate')?.value || '';
        let beforeDateStr = document.getElementById('salvation-beforedate')?.value || '';
        let afterDateInclude = document.getElementById('salvation-afterdate-include')?.checked || false;
        let beforeDateInclude = document.getElementById('salvation-beforedate-include')?.checked || false;
        let filterText = document.getElementById('salvation-filter-text')?.value || '';
        let filterHasLink = document.getElementById('salvation-haslink')?.checked || false;
        let filterHasFile = document.getElementById('salvation-hasfile')?.checked || false;
        let filterPinned = document.getElementById('salvation-pinned')?.checked || false;
        let regex = document.getElementById('salvation-filter-regex')?.value || '';
        let minlen = document.getElementById('salvation-filter-minlen')?.value || '';
        let maxlen = document.getElementById('salvation-filter-maxlen')?.value || '';
        let deleteLimit = parseInt(document.getElementById('salvation-delete-limit')?.value || '', 10);
        let details = [];
        if (afterId) details.push(`afterId: ${afterId}`);
        if (beforeId) details.push(`beforeId: ${beforeId}`);
        if (afterDateStr) details.push(`afterDate: ${afterDateStr}`);
        if (beforeDateStr) details.push(`beforeDate: ${beforeDateStr}`);
        if (filterText) details.push(`filterText: ${filterText}`);
        if (filterHasLink) details.push('filterHasLink');
        if (filterHasFile) details.push('filterHasFile');
        if (filterPinned) details.push('filterPinned');
        if (regex) details.push(`regex: ${regex}`);
        if (minlen) details.push(`minlen: ${minlen}`);
        if (maxlen) details.push(`maxlen: ${maxlen}`);
        if (details.length) {
            log('Applied filters/details: ' + details.join(', '), 'debug');
        } else {
            log('No additional filters/details applied.', 'debug');
        }

        let totalToDelete = 0;
        let totalDeleted = 0;
        let totalFailed = 0;
        let allOwnMessages = [];
        let allMessagesCount = 0;
        let perChannelStats = [];
        const startTime = Date.now();

        for (let queueIdx = 0; queueIdx < fullQueue.length; queueIdx++) {
            const { channelId, alert } = fullQueue[queueIdx];
            log(`\n--- [${queueIdx+1}/${fullQueue.length}] Processing channel: ${channelId} ---`, 'info');
            log('Checking message count...', 'info');
            const token = getToken();
            const authorId = document.getElementById('salvation-author').value.trim();
            if (!token || !authorId) {
                log('Please provide Author ID and a valid token.', 'error');
                setDeleteButtonState(false);
                isDeleting = false;
                return;
            }
            const allMessages = await fetchAllMessages(token, channelId);
            allMessagesCount += allMessages.length;
            let own = filterMessages(allMessages, {
                authorId,
                skipType3: true,
                afterId,
                beforeId,
                afterIdInclude,
                beforeIdInclude,
                afterDateStr,
                beforeDateStr,
                afterDateInclude,
                beforeDateInclude,
                filterText,
                filterHasLink,
                filterHasFile,
                filterPinned,
                regex,
                minlen,
                maxlen
            });
            if (!isNaN(deleteLimit) && deleteLimit > 0) {
                own = own.slice(0, deleteLimit);
            }
            log(`Fetched ${own.length} of your messages out of ${allMessages.length} total messages in this channel`, 'success');
            allOwnMessages = allOwnMessages.concat(own);
            totalToDelete += own.length;
            perChannelStats.push({ channelId, total: allMessages.length, own: own.length });
            if (!own.length) {
                log('No messages to delete in this channel.', 'info');
                continue;
            }
            if (alert) {
                let skipThis = false;
                await new Promise(resolve => {
                    showDeleteConfirmation(() => { skipThis = true; resolve(); }, () => resolve(), own);
                });
                if (skipThis) {
                    log('Skipped channel ' + channelId + ' (user cancelled)', 'warn');
                    continue;
                }
            }
            showProgressBar(own.length);
            let deleted = 0, failed = 0;
            for (let i = 0; i < own.length; i++) {
                if (stopDelete || (deleteTask && deleteTask.cancelled)) {
                    hideProgressBar();
                    log('Deletion cancelled.', 'warn');
                    isDeleting = false;
                    stopDelete = false;
                    deleteTask = null;
                    setDeleteButtonState(false);
                    return;
                }
                const msg = own[i];
                let ok = false;
                let deleteRetries = 0;
                while (!ok) {
                    let del;
                    try {
                        del = await fetch(`https://discord.com/api/v9/channels/${channelId}/messages/${msg.id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': token }
                        });
                    } catch (e) {
                        if (deleteRetries < 3) {
                            deleteRetries++;
                            log(`Network error while deleting, retrying (${deleteRetries}/3)...`, 'warn');
                            await new Promise(r => setTimeout(r, 1500));
                            continue;
                        } else {
                            log(`Network error: Unable to delete message ${msg.id} after 3 attempts.`, 'error');
                            failed++;
                            ok = true;
                            continue;
                        }
                    }
                    if (del) {
                        if (del.status === 204) {
                            deleted++;
                            totalDeleted++;
                            updateProgressBar(deleted, own.length);
                            let elapsed = (Date.now() - startTime) / 1000;
                            let avgPerMsg = totalDeleted ? elapsed / totalDeleted : 0;
                            let estSecLeft = avgPerMsg ? Math.round(avgPerMsg * (totalToDelete - totalDeleted)) : null;
                            updateProgressBarInfo({etaSec: estSecLeft, elapsedSec: elapsed, pageCount: 1, deleted: totalDeleted});
                            const msgDate = msg.timestamp ? new Date(msg.timestamp).toLocaleString('en-US') : '';
                            const username = msg.author?.username || 'Unknown user';
                            const content = (msg.content || '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
                            const hideInfo = document.getElementById('salvation-hideinfo');
                            if (!hideInfo || !hideInfo.checked) {
                                log(`[${deleted}/${own.length}] ${msgDate} | ${username} | ${content}`, 'deleteinfo');
                            }
                            ok = true;
                        } else if (del.status === 429) {
                            const data = await del.json();
                            const retry = data.retry_after || 1.5;
                            log(`Discord rate limit! Waiting ${retry}s...`, 'warn');
                            await new Promise(r => setTimeout(r, retry * 1000));
                        } else if (del.status === 401 || del.status === 403) {
                            log('Authorization error: Invalid or expired token.', 'error');
                            failed++;
                            totalFailed++;
                            ok = true;
                        } else {
                            failed++;
                            totalFailed++;
                            log(`Delete error (${msg.id})! HTTP status: ${del.status}`, 'error');
                            ok = true;
                        }
                    } else {
                        failed++;
                        totalFailed++;
                        ok = true;
                    }
                }
                await new Promise(r => setTimeout(r, DELETE_MESSAGE_DELAY));
            }
            hideProgressBar();
            log(`Deleted ${deleted} messages in channel ${channelId}`, 'success');
            playSound('success');
            if (failed > 0) log(`Not deleted in channel ${channelId}: ${failed}`, 'error');
            const closeDmCheckbox = document.getElementById('salvation-closedm');
            if (closeDmCheckbox && closeDmCheckbox.checked) {
                try {
                    const channelInfoResp = await fetch(`https://discord.com/api/v9/channels/${channelId}`, {
                        headers: { 'Authorization': token }
                    });
                    if (!channelInfoResp.ok) {
                        log('Failed to fetch channel info. Cannot determine if DM.', 'warn');
                    } else {
                        const channelInfo = await channelInfoResp.json();
                        if (channelInfo.type === 1 || channelInfo.type === 3) {
                            await fetch(`https://discord.com/api/v9/channels/${channelId}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': token }
                            }).then(resp => {
                                if (resp.status === 200 || resp.status === 204) {
                                    log('DM closed.', 'success');
                                } else {
                                    log('Failed to close DM. Code: ' + resp.status, 'warn');
                                }
                            }).catch(e => log('Error closing DM: ' + e, 'error'));
                        } else {
                            log('This is not a DM channel. Closing is only available for private messages.', 'warn');
                        }
                    }
                } catch (e) {
                    log('Error checking channel type: ' + e, 'error');
                }
            }

            if (queueIdx > 0) { 
              queueStatus[queueIdx-1] = 'done';
              renderQueue();
            }
        }
        const elapsed = Date.now() - startTime;
        let elapsedSec = Math.round(elapsed / 1000);
        let hours = Math.floor(elapsedSec / 3600);
        let minutes = Math.floor((elapsedSec % 3600) / 60);
        let seconds = elapsedSec % 60;
        let timeStr =
            (hours > 0 ? hours + 'h ' : '') +
            (minutes > 0 ? minutes + 'min ' : '') +
            seconds + 's';
        log(`\n=== FINISHED ===`, 'success');
        log(`Deleted ${totalDeleted} messages in total, elapsed time: ${timeStr}`, 'success');
        if (totalFailed > 0) log(`Not deleted: ${totalFailed}`, 'error');
        setDeleteButtonState(false);
        isDeleting = false;
        updateProgressBar(totalToDelete, totalToDelete);
        updateProgressBarInfo({etaSec: 0, elapsedSec: (Date.now() - startTime) / 1000, pageCount: 1, deleted: totalDeleted});
    }

    try {
        const old = document.querySelector('.salvation-root');
        if (old) old.remove();
        createDiscordLikeGUI();
        setTimeout(bindEvents, 0); 
        console.log('[!!!!!!!!!!] test123456', document.querySelector('.salvation-root'));
    } catch (e) {
        console.error('? cwel:', e);
    }

    function bindEvents() {
        const clearBtn = document.getElementById('salvation-clear');
        if (clearBtn) clearBtn.onclick = clearLog;
        const downloadBtn = document.getElementById('salvation-download');
        if (downloadBtn) downloadBtn.onclick = downloadLog;
        const downloadMsgBtn = document.getElementById('salvation-downloadmsg');
        if (downloadMsgBtn) downloadMsgBtn.onclick = async (e) => {
            e.preventDefault();
            const token = getToken();
            const channelId = document.getElementById('salvation-channel').value.trim();
            if (!token) { log('Error: No Discord token!', 'error'); return; }
            if (!channelId) { log('Error: Enter Channel ID!', 'error'); return; }
            log('Downloading to HTML', 'info');
            const messages = await fetchAllMessages(token, channelId);
            downloadHtml(messages);
        };
        const deleteBtn = document.getElementById('salvation-delete');
        if (deleteBtn) deleteBtn.onclick = () => {
            if (isDeleting) {
                stopDelete = true;
                if (deleteTask) deleteTask.cancelled = true;
                isDeleting = false;
                hideProgressBar();
                setDeleteButtonState(false);
            } else {
                deleteAllOwnMessages();
            }
        };
        const meBtn = document.getElementById('salvation-me');
        if (meBtn) meBtn.onclick = async () => {
            const token = getToken();
            if (!token) { log('Error fetching Discord token! Make sure you are logged in to Discord in this browser.', 'error'); return; }
            const userId = await getOwnUserId(token);
            if (userId) {
                document.getElementById('salvation-author').value = userId;
                log('Fetched Author ID: ' + userId, 'success');
            } else {
                log('Error fetching Author ID!', 'error');
            }
        };
        const guildBtn = document.getElementById('salvation-guild');
        if (guildBtn) guildBtn.onclick = () => {
            const ids = getCurrentGuildAndChannel();
            if (ids.guild) {
                document.getElementById('salvation-server').value = ids.guild;
                log('Fetched Server ID: ' + ids.guild, 'success');
            } else {
                log('Error fetching Server ID!', 'error');
            }
        };
        const channelBtn = document.getElementById('salvation-channelbtn');
        if (channelBtn) channelBtn.onclick = () => {
            const ids = getCurrentGuildAndChannel();
            if (ids.channel) {
                document.getElementById('salvation-channel').value = ids.channel;
                log('Fetched Channel ID: ' + ids.channel, 'success');
            } else {
                log('Error fetching Channel ID!', 'error');
            }
        };
        const countBtn = document.getElementById('salvation-count');
        if (countBtn) countBtn.onclick = async () => {
            const token = getToken();
            const channelId = document.getElementById('salvation-channel').value.trim();
            const authorId = document.getElementById('salvation-author').value.trim();
            if (!token) { log('Error: No Discord token!', 'error'); return; }
            if (!channelId) { log('Error: Enter Channel ID!', 'error'); return; }
            if (!authorId) { log('Error: Enter Author ID!', 'error'); return; }
            log('Counting messages...', 'info');
            const allMessages = await fetchAllMessages(token, channelId);
            let own = filterMessages(allMessages, {
                authorId,
                skipType3: true,
                afterId: document.getElementById('salvation-afterid')?.value || '',
                beforeId: document.getElementById('salvation-beforeid')?.value || '',
                afterDateStr: document.getElementById('salvation-afterdate')?.value || '',
                beforeDateStr: document.getElementById('salvation-beforedate')?.value || '',
                filterText: document.getElementById('salvation-filter-text')?.value || '',
                filterHasLink: document.getElementById('salvation-haslink')?.checked || false,
                filterHasFile: document.getElementById('salvation-hasfile')?.checked || false,
                filterPinned: document.getElementById('salvation-pinned')?.checked || false,
                regex: document.getElementById('salvation-filter-regex')?.value || '',
                minlen: document.getElementById('salvation-filter-minlen')?.value || '',
                maxlen: document.getElementById('salvation-filter-maxlen')?.value || ''
            });
            let deleteLimit = parseInt(document.getElementById('salvation-delete-limit')?.value || '', 10);
            if (!isNaN(deleteLimit) && deleteLimit > 0) {
                own = own.slice(0, deleteLimit);
            }
            log(`You have ${own.length} messages out of ${allMessages.length} total messages in this channel.`, 'success');
            if (own.length > 0) {
                const estSeconds = Math.round(own.length * (DELETE_MESSAGE_DELAY / 1000) * 1.1);
                const estMin = Math.floor(estSeconds / 60);
                const estSec = estSeconds % 60;
                log(`Estimated deletion time: ${estMin > 0 ? estMin + ' min ' : ''}${estSec} sec`, 'info');
            }
        };
        const previewBtn = document.getElementById('salvation-preview');
        if (previewBtn) previewBtn.onclick = async (e) => {
            e.preventDefault();
            const token = getToken();
            const channelId = document.getElementById('salvation-channel').value.trim();
            const authorId = document.getElementById('salvation-author').value.trim();
            if (!token) { log('Error: No Discord token!', 'error'); return; }
            if (!channelId) { log('Error: Enter Channel ID!', 'error'); return; }
            if (!authorId) { log('Error: Enter Author ID!', 'error'); return; }
            log('Fetching messages for preview...', 'info');
            const allMessages = await fetchAllMessages(token, channelId);
            let own = filterMessages(allMessages, {
                authorId,
                skipType3: true,
                afterId: document.getElementById('salvation-afterid')?.value || '',
                beforeId: document.getElementById('salvation-beforeid')?.value || '',
                afterDateStr: document.getElementById('salvation-afterdate')?.value || '',
                beforeDateStr: document.getElementById('salvation-beforedate')?.value || '',
                filterText: document.getElementById('salvation-filter-text')?.value || '',
                filterHasLink: document.getElementById('salvation-haslink')?.checked || false,
                filterHasFile: document.getElementById('salvation-hasfile')?.checked || false,
                filterPinned: document.getElementById('salvation-pinned')?.checked || false,
                regex: document.getElementById('salvation-filter-regex')?.value || '',
                minlen: document.getElementById('salvation-filter-minlen')?.value || '',
                maxlen: document.getElementById('salvation-filter-maxlen')?.value || ''
            });
            let deleteLimit = parseInt(document.getElementById('salvation-delete-limit')?.value || '', 10);
            if (!isNaN(deleteLimit) && deleteLimit > 0) {
                own = own.slice(0, deleteLimit);
            }
            showPreviewModal(own);
        };
        const downloadCurrentBtn = document.getElementById('salvation-downloadcurrent');
        if (downloadCurrentBtn) downloadCurrentBtn.onclick = () => {
            const logEl = document.getElementById('salvation-logarea');
            if (!logEl) {
                log('No log area found.', 'warn');
                return;
            }
            const messages = [];
            const children = Array.from(logEl.children);
            for (const el of children) {
                if (el.tagName === 'SPAN') {
                    messages.push(el.textContent);
                }
            }
            if (!messages.length) {
                log('No log messages to download.', 'warn');
                return;
            }
            const blob = new Blob([JSON.stringify(messages, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'salvation-current-log.json';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };
    }
    let logBuffer = [];
    let lastAudioCtx = null;
    function playSound(type) {
        const soundOn = document.getElementById('salvation-sound');
        if (!soundOn || !soundOn.checked) return;
        if (type !== 'success') return;
        try {
            if (lastAudioCtx) {
                lastAudioCtx.close();
                lastAudioCtx = null;
            }
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            lastAudioCtx = ctx;
            const g = ctx.createGain();
            g.gain.value = 0.13;
            g.connect(ctx.destination);

            const o1 = ctx.createOscillator();
            o1.type = 'triangle';
            o1.frequency.value = 660;
            o1.connect(g);
            o1.start();
            o1.stop(ctx.currentTime + 0.13);

            const o2 = ctx.createOscillator();
            o2.type = 'triangle';
            o2.frequency.value = 1040;
            o2.connect(g);
            o2.start(ctx.currentTime + 0.13);
            o2.stop(ctx.currentTime + 0.26);

            o2.onended = () => {
                ctx.close();
                if (lastAudioCtx === ctx) lastAudioCtx = null;
            };
        } catch {}
    }

    function log(msg, type = 'info') {
        if (type === 'debug') {
            const nodebug = document.getElementById('salvation-nodebug');
            if (nodebug && nodebug.checked) {
                return;
            }
        }
        if (typeof msg === 'object' && msg !== null) {
            msg = JSON.stringify(msg, null, 2);
        }
        if (!["info","success","error","warn","debug","deleteinfo"].includes(type)) type = 'info';
        const logEl = document.getElementById('salvation-logarea');
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', {hour12: false});
        const span = document.createElement('span');
        span.className = 'salvation-log-' + type;
        span.innerHTML = `<span class=\"salvation-log-time\">[${time}]</span> ${msg}`;
        if (document.getElementById('salvation-sound') && document.getElementById('salvation-sound').checked) {
            if (/\[\d{2}:\d{2}:\d{2}\] Deleted \d+ messages, elapsed time: \d+[hms ]*/.test(span.textContent)) {
                playSound('success');
            }
        }
        if (logEl) {
            logEl.appendChild(span);
            logEl.appendChild(document.createElement('br'));
            const autoScroll = document.getElementById('salvation-autoscroll');
            if (!autoScroll || autoScroll.checked) {
            logEl.scrollTop = logEl.scrollHeight;
            }
        }
        logBuffer.push({ time, type, msg });
    }
    function clearLog() {
        const logEl = document.getElementById('salvation-logarea');
        if (logEl) logEl.innerHTML = '';
        logBuffer = [];
    }
    function downloadJson(data, filename) {
        if (!data || (Array.isArray(data) && !data.length)) {
            log('No data to download.', 'warn');
            return;
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    function downloadLog() {
        downloadJson(logBuffer, 'salvation-log.json');
    }
    function getToken() {
        try {
            const LS = document.body.appendChild(document.createElement('iframe')).contentWindow.localStorage;
            return JSON.parse(LS.token);
        } catch {
            try {
                return (window.webpackChunkdiscord_app.push([[''], {}, e => { window.m = []; for (let c in e.c) window.m.push(e.c[c]); }]), window.m)
                    .find(m => m?.exports?.default?.getToken !== void 0)
                    .exports.default.getToken();
            } catch (e) {
                console.error('[getToken] Nie udało się pobrać tokena przez localStorage ani webpack:', e);
                return null;
            }
        }
    }
    async function getOwnUserId(token) {
        const resp = await fetch('https://discord.com/api/v9/users/@me', {
            headers: { 'Authorization': token }
        });
        if (resp.status === 200) {
            const data = await resp.json();
            return data.id;
        } else {
            return null;
        }
    }
    function getCurrentGuildAndChannel() {
        const m = location.pathname.match(/channels\/([\w@]+)\/(\d+)/);
        if (m) return { guild: m[1], channel: m[2] };
        return { guild: '', channel: '' };
    }
    async function fetchAllMessages(token, channelId) {
        let messages = [];
        let before = null;
        let done = false;
        let retries = 0;
        while (!done) {
            let url = `https://discord.com/api/v9/channels/${channelId}/messages?limit=100`;
            if (before) url += `&before=${before}`;
            let resp;
            try {
                resp = await fetch(url, { headers: { 'Authorization': token } });
            } catch (e) {
                if (retries < 3) {
                    retries++;
                    log(`Network error, retrying (${retries}/3)...`, 'warn');
                    await new Promise(r => setTimeout(r, 1500));
                    continue;
                } else {
                    log('Network error: Unable to fetch messages after 3 attempts.', 'error');
                    break;
                }
            }
            if (resp.status === 401 || resp.status === 403) {
                log('Authorization error: Invalid or expired token.', 'error');
                break;
            }
            if (resp.status === 429) {
                const data = await resp.json();
                const retry = data.retry_after || 1.5;
                log(`Rate limit! Waiting ${retry}s...`, 'warn');
                await new Promise(r => setTimeout(r, retry * 1000));
                continue;
            }
            if (resp.status !== 200) {
                log(`HTTP error: ${resp.status}`, 'error');
                break;
            }
            const batch = await resp.json();
            if (!Array.isArray(batch) || batch.length === 0) break;
            messages = messages.concat(batch);
            before = batch[batch.length - 1].id;
            if (batch.length < 100) done = true;
        }
        log('Downloaded: ' + messages.length + ' messages', 'success');
        return messages;
    }


    function downloadHtml(messages) {
        if (!messages || !messages.length) {
            log('No messages to download.', 'warn');
            return;
        }
        messages = messages.slice().reverse();
        const guildId = document.getElementById('salvation-server')?.value?.trim() || 'brak_guild';
        const channelId = document.getElementById('salvation-channel')?.value?.trim() || 'brak_channel';
        let html = `<!DOCTYPE html><html lang=\"pl\"><head><meta charset=\"utf-8\"><title>Discord chat export</title><style>
        body{background:#313338;color:#fff;font-family:'gg sans','Segoe UI',sans-serif;margin:0;padding:0;}
        .chat-container{max-width:700px;margin:32px auto 32px auto;background:#23272a;border-radius:16px;box-shadow:0 8px 32px #000a;padding:24px 0;}
        .msg{display:flex;align-items:flex-start;gap:14px;padding:18px 32px 10px 32px;}
        .msg+.msg{border-top:1px solid #36393f;}
        .msg-avatar{width:44px;height:44px;border-radius:50%;background:#18191c;object-fit:cover;}
        .msg-main{flex:1;min-width:0;}
        .msg-header{display:flex;align-items:baseline;gap:10px;}
        .msg-author{font-weight:700;color:#00b0f4;font-size:17px;}
        .msg-time{color:#aaa;font-size:13px;}
        .msg-content{margin-top:2px;white-space:pre-wrap;word-break:break-word;font-size:16px;line-height:1.5;}
        .msg-embed{background:#23272a;padding:6px 10px;border-radius:6px;margin-top:6px;color:#43b581;font-size:13px;}
        .msg-attach{color:#faa61a;font-size:13px;display:block;margin-top:6px;}
        .msg-pinned{color:#faa61a;font-size:13px;margin-left:8px;}
        .chat-title{font-size:24px;font-weight:800;text-align:center;margin-bottom:24px;letter-spacing:1px;color:#fff;}
        </style></head><body><div class='chat-container'>
        <div class='chat-title'>Discord chat export</div>`;
        for (const msg of messages) {
            html += `<div class='msg'>`;
            let avatar = msg.author?.avatar ?
                `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png?size=64` :
                'https://cdn.discordapp.com/embed/avatars/0.png';
            html += `<img class='msg-avatar' src='${avatar}' alt='avatar'>`;
            html += `<div class='msg-main'>`;
            html += `<div class='msg-header'>`;
            html += `<span class='msg-author'>${escapeHtml(msg.author?.username || 'Unknown')}</span>`;
            html += `<span style="color:#aaa;font-size:13px;margin-left:8px;">(ID: ${msg.author?.id || 'none'})</span>`;
            html += `<span style="color:#aaa;font-size:13px;margin-left:8px;">MsgID: ${msg.id}</span>`;
            if (msg.pinned) html += `<span class='msg-pinned' title='Pinned message'>📌 pinned</span>`;
            let dateStr = '';
            if (msg.timestamp) {
                const d = new Date(msg.timestamp);
                if (!isNaN(d)) {
                    dateStr = d.toLocaleString('en-US', {hour12:false});
                } else {
                    dateStr = escapeHtml(msg.timestamp);
                }
            }
            html += `<span class='msg-time'>${dateStr}</span>`;
            html += `</div>`;
            html += `<div class='msg-content'>${escapeHtml(msg.content || '')}</div>`;
            if (msg.embeds && msg.embeds.length) {
                for (const embed of msg.embeds) {
                    html += `<div class='msg-embed'>`;
                    if (embed.title) html += `<div style='font-weight:700;color:#60a5fa;'>${escapeHtml(embed.title)}</div>`;
                    if (embed.description) html += `<div style='color:#b9bbbe;'>${escapeHtml(embed.description)}</div>`;
                    if (embed.url) html += `<div><a href='${escapeHtml(embed.url)}' target='_blank' style='color:#34d399;'>${escapeHtml(embed.url)}</a></div>`;
                    if (embed.thumbnail && embed.thumbnail.url) html += `<img src='${escapeHtml(embed.thumbnail.url)}' style='max-width:120px;max-height:120px;border-radius:6px;margin-top:4px;'>`;
                    if (embed.image && embed.image.url) html += `<img src='${escapeHtml(embed.image.url)}' style='max-width:320px;max-height:320px;border-radius:6px;margin-top:4px;'>`;
                    html += `</div>`;
                }
            }
            if (msg.attachments && msg.attachments.length) {
                for (const a of msg.attachments) {
                    const isGif = a.url.endsWith('.gif');
                    if (isGif) {
                        html += `<span class='msg-attach'>GIF: <img src='${escapeHtml(a.url)}' alt='gif' style='max-width:220px;max-height:220px;vertical-align:middle;border-radius:6px;'></span>`;
                    } else if (a.content_type && a.content_type.startsWith('image/')) {
                        html += `<span class='msg-attach'>Obrazek: <img src='${escapeHtml(a.url)}' alt='img' style='max-width:220px;max-height:220px;vertical-align:middle;border-radius:6px;'></span>`;
                    } else {
                        html += `<span class='msg-attach'>Zalacznik: <a href='${escapeHtml(a.url)}' target='_blank'>${escapeHtml(a.filename)}</a></span>`;
                    }
                }
            }
            html += `</div></div>`;
        }
        html += `</div></body></html>`;
        const blob = new Blob([html], {type: 'text/html'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `salvation-${guildId}-${channelId}.html`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    function escapeHtml(str) {
        return String(str).replace(/[&<>"']|'/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]));
    }

    const main = document.querySelector('.salvation-main');
    if (main && !document.getElementById('salvation-autoscroll-wrap')) {
        const toolbar = main.querySelector('.salvation-toolbar');
        const autoScrollDiv = document.createElement('div');
        autoScrollDiv.id = 'salvation-autoscroll-wrap';
        autoScrollDiv.innerHTML = `
            <label for="salvation-autoscroll"><input type="checkbox" id="salvation-autoscroll" checked>Auto-scroll</label>
            <label for="salvation-sound"><input type="checkbox" id="salvation-sound">Sound</label>
            <label for="salvation-closedm"><input type="checkbox" id="salvation-closedm">Close DM after deletion</label>
            <label for="salvation-streamermode"><input type="checkbox" id="salvation-streamermode">Streamer Mode</label>
        `;
        toolbar.parentNode.insertBefore(autoScrollDiv, toolbar.nextSibling);
    }

    const styleDeleteInfo = document.createElement('style');
    styleDeleteInfo.textContent = `.salvation-log-deleteinfo { color: #a78bfa !important; font-weight: 600; }`;
    document.head.appendChild(styleDeleteInfo);

    function showPreviewModal(messages) {
        const old = document.getElementById('salvation-preview-modal');
        if (old) old.remove();
        const modal = document.createElement('div');
        modal.id = 'salvation-preview-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.55)';
        modal.style.zIndex = '10000';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.innerHTML = `
          <div style="background:#23272a;color:#fff;max-width:800px;width:90vw;max-height:80vh;overflow-y:auto;border-radius:14px;box-shadow:0 8px 32px #000a;padding:0 0 24px 0;position:relative;overflow-x:hidden;">
            <div style="padding:18px 32px 0 32px;display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:22px;font-weight:800;">Preview of messages to delete</span>
              <button id="salvation-preview-close" style="background:none;border:none;color:#aaa;font-size:28px;cursor:pointer;">×</button>
            </div>
            <div class="preview-chat-container" style="max-height:60vh;overflow-y:auto;padding:0 32px 0 32px;overflow-x:hidden;">
              ${messages.length === 0 ? '<div style="margin:32px 0;font-size:18px;color:#aaa;">No messages to preview.</div>' : messages.map(msg => {
                let avatar = msg.author?.avatar ?
                    `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png?size=64` :
                    'https://cdn.discordapp.com/embed/avatars/0.png';
                let dateStr = '';
                if (msg.timestamp) {
                    const d = new Date(msg.timestamp);
                    if (!isNaN(d)) {
                        dateStr = d.toLocaleString('pl-PL', {hour12:false});
                    } else {
                        dateStr = msg.timestamp;
                    }
                }
                return `<div class='preview-msg'>
                  <img class='preview-msg-avatar' src='${avatar}'>
                  <div class='preview-msg-main'>
                    <div class='preview-msg-header'>
                      <span class='preview-msg-author'>${escapeHtml(msg.author?.username || 'Unknown')}</span>
                      <span class='preview-msg-id'>(ID: ${msg.author?.id || 'none'})</span>
                      <span class='preview-msg-msgid'>MsgID: ${msg.id}</span>
                      ${msg.pinned ? `<span style='color:#faa61a;font-size:13px;margin-left:8px;'>📌 pinned</span>` : ''}
                      <span class='preview-msg-time'>${dateStr}</span>
                    </div>
                    <div class='preview-msg-content'>${escapeHtml(msg.content || '')}</div>
                    ${(msg.attachments && msg.attachments.length) ? msg.attachments.map(a => {
                      const isGif = a.url.endsWith('.gif');
                      if (isGif) {
                        return `<span class='preview-msg-attach'>GIF: <img src='${escapeHtml(a.url)}' alt='gif'></span>`;
                      } else if (a.content_type && a.content_type.startsWith('image/')) {
                        return `<span class='preview-msg-attach'>Image: <img src='${escapeHtml(a.url)}' alt='img'></span>`;
                      } else {
                        return `<span class='preview-msg-attach'>Attachment: <a href='${escapeHtml(a.url)}' target='_blank'>${escapeHtml(a.filename)}</a></span>`;
                      }
                    }).join('') : ''}
                    ${(msg.embeds && msg.embeds.length) ? msg.embeds.map(embed => {
                      let html = `<div class='preview-msg-embed'>`;
                      if (embed.title) html += `<div style='font-weight:700;color:#60a5fa;'>${escapeHtml(embed.title)}</div>`;
                      if (embed.description) html += `<div style='color:#b9bbbe;'>${escapeHtml(embed.description)}</div>`;
                      if (embed.url) html += `<div><a href='${escapeHtml(embed.url)}' target='_blank' style='color:#34d399;'>${escapeHtml(embed.url)}</a></div>`;
                      if (embed.thumbnail && embed.thumbnail.url) html += `<img src='${escapeHtml(embed.thumbnail.url)}'>`;
                      if (embed.image && embed.image.url) html += `<img src='${escapeHtml(embed.image.url)}'>`;
                      html += `</div>`;
                      return html;
                    }).join('') : ''}
                  </div>
                </div>`;
              }).join('')}
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('salvation-preview-close').onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    }

    let autoFillIds = { server: true, channel: true, author: true };
    function fillIdsFromUrl() {
        if (isDeleting) return; 
        if (!autoFillIds.server && !autoFillIds.channel && !autoFillIds.author) return;
        const m = location.pathname.match(/channels\/([\w@]+)\/(\d+)/);
        if (m) {
            if (autoFillIds.server) {
                const serverInput = document.getElementById('salvation-server');
                if (serverInput) serverInput.value = m[1];
            }
            if (autoFillIds.channel) {
                const channelInput = document.getElementById('salvation-channel');
                if (channelInput) channelInput.value = m[2];
            }
        }
        if (autoFillIds.author) {
            const authorInput = document.getElementById('salvation-author');
            if (authorInput) {
                getOwnUserId(getToken()).then(userId => {
                    if (userId) authorInput.value = userId;
                });
            }
        }
    }
    function disableAutoFillOnEdit() {
        const serverInput = document.getElementById('salvation-server');
        const channelInput = document.getElementById('salvation-channel');
        const authorInput = document.getElementById('salvation-author');
        if (serverInput) serverInput.addEventListener('input', () => { autoFillIds.server = false; });
        if (channelInput) channelInput.addEventListener('input', () => { autoFillIds.channel = false; });
        if (authorInput) authorInput.addEventListener('input', () => { autoFillIds.author = false; });
    }
    function listenUrlChange() {
        let lastUrl = location.href;
        setInterval(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                fillIdsFromUrl();
            }
        }, 500);
    }
    setTimeout(() => {
        fillIdsFromUrl();
        disableAutoFillOnEdit();
        listenUrlChange();
    }, 500);

    setTimeout(() => {
        const main = document.querySelector('.salvation-main');
        if (!main || document.getElementById('salvation-logfilter-bar')) return;
        const logarea = document.getElementById('salvation-logarea');
        const bar = document.createElement('div');
        bar.id = 'salvation-logfilter-bar';
        bar.style.display = 'flex';
        bar.style.alignItems = 'center';
        bar.style.gap = '12px';
        bar.style.margin = '10px 0 0 0';
        bar.style.flexWrap = 'wrap';
        bar.innerHTML = `
          <label style="font-size:12px;"><input type="checkbox" id="logf-info" checked> info</label>
          <label style="font-size:12px;"><input type="checkbox" id="logf-success" checked> success</label>
          <label style="font-size:12px;"><input type="checkbox" id="logf-error" checked> error</label>
          <label style="font-size:12px;"><input type="checkbox" id="logf-warn" checked> warn</label>
          <label style="font-size:12px;"><input type="checkbox" id="logf-debug"> debug</label>
          <label style="font-size:12px;"><input type="checkbox" id="logf-deleteinfo" checked> deleted</label>
          <input id="logf-search" type="text" placeholder="Search logs..." style="font-size:13px;padding:3px 8px;border-radius:6px;border:1px solid #23272a;background:#18191c;color:#fff;outline:none;min-width:120px;flex:1;">
        `;
        main.insertBefore(bar, logarea);
        function filterLogs() {
            const types = [];
            if (document.getElementById('logf-info').checked) types.push('info');
            if (document.getElementById('logf-success').checked) types.push('success');
            if (document.getElementById('logf-error').checked) types.push('error');
            if (document.getElementById('logf-warn').checked) types.push('warn');
            if (document.getElementById('logf-debug').checked) types.push('debug');
            if (document.getElementById('logf-deleteinfo').checked) types.push('deleteinfo');
            const search = document.getElementById('logf-search').value.toLowerCase();
            const logEl = document.getElementById('salvation-logarea');
            if (!logEl) return;
            const children = Array.from(logEl.children);
            for (const el of children) {
                if (el.tagName !== 'SPAN') continue;
                const type = (el.className || '').replace('salvation-log-', '');
                const text = el.textContent.toLowerCase();
                const visible = types.includes(type) && (!search || text.includes(search));
                el.style.display = visible ? '' : 'none';
                if (el.nextSibling && el.nextSibling.tagName === 'BR') {
                    el.nextSibling.style.display = visible ? '' : 'none';
                }
            }
        }
        bar.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.addEventListener('change', filterLogs));
        document.getElementById('logf-search').addEventListener('input', filterLogs);
        const origLog = log;
        log = function(msg, type = 'info') {
            origLog(msg, type);
            filterLogs();
        };
        const origClearLog = clearLog;
        clearLog = function() {
            origClearLog();
            filterLogs();
        };
        filterLogs();
    }, 1000);

    function showDeleteConfirmation(onCancel, onConfirm, messagesToDelete) {
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.55)';
        modal.style.zIndex = '10000';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        let count = Array.isArray(messagesToDelete) ? messagesToDelete.length : 0;
        let boundaryInfo = [];
        const afterId = document.getElementById('salvation-afterid')?.value || '';
        const beforeId = document.getElementById('salvation-beforeid')?.value || '';
        const afterIdInclude = document.getElementById('salvation-afterid-include')?.checked || false;
        const beforeIdInclude = document.getElementById('salvation-beforeid-include')?.checked || false;
        const afterDate = document.getElementById('salvation-afterdate')?.value || '';
        const beforeDate = document.getElementById('salvation-beforedate')?.value || '';
        const afterDateInclude = document.getElementById('salvation-afterdate-include')?.checked || false;
        const beforeDateInclude = document.getElementById('salvation-beforedate-include')?.checked || false;
        if (afterId && afterIdInclude) boundaryInfo.push(`Include after message ID: <b>${afterId}</b>`);
        if (beforeId && beforeIdInclude) boundaryInfo.push(`Include before message ID: <b>${beforeId}</b>`);
        if (afterDate && afterDateInclude) boundaryInfo.push(`Include after date: <b>${afterDate}</b>`);
        if (beforeDate && beforeDateInclude) boundaryInfo.push(`Include before date: <b>${beforeDate}</b>`);
        let boundaryHtml = '';
        if (boundaryInfo.length) {
            boundaryHtml = `<div style='color:#60a5fa;font-size:13px;margin:8px 0 0 0;text-align:center;'>${boundaryInfo.join('<br>')}</div>`;
        }
        modal.innerHTML = `
          <div style="background:#23272a;color:#fff;max-width:400px;width:90vw;max-height:80vh;overflow-y:auto;border-radius:14px;box-shadow:0 8px 32px #000a;padding:32px 32px 24px 32px;position:relative;overflow-x:hidden;display:flex;flex-direction:column;align-items:center;">
            <div style="font-size:20px;font-weight:700;margin-bottom:18px;text-align:center;">Are you sure you want to delete <span style='color:#f87171;'>${count}</span> message${count===1?'':'s'}?</div>
            ${boundaryHtml}
            <div style="display:flex;gap:18px;justify-content:center;margin-bottom:18px;">
              <button id="salvation-confirm-delete" style="background:#f04747;color:#fff;border:none;border-radius:8px;padding:10px 24px;font-size:16px;font-weight:700;cursor:pointer;">Yes, delete</button>
              <button id="salvation-cancel-delete" style="background:#23272a;color:#aaa;border:1.5px solid #aaa;border-radius:8px;padding:10px 24px;font-size:16px;font-weight:700;cursor:pointer;">Cancel</button>
              <button id="salvation-download-confirmation" style="background:#23272a;color:#60a5fa;border:1.5px solid #60a5fa;border-radius:8px;padding:10px 24px;font-size:16px;font-weight:700;cursor:pointer;">Download messages</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('salvation-confirm-delete').onclick = () => {
            modal.remove();
            onConfirm();
        };
        document.getElementById('salvation-cancel-delete').onclick = () => {
            modal.remove();
            if (onCancel) onCancel();
        };
        document.getElementById('salvation-download-confirmation').onclick = () => {
            if (!messagesToDelete || !messagesToDelete.length) return;
            downloadHtml(messagesToDelete);
        };
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    }

    function updateStreamerModeUI() {
        const streamer = document.getElementById('salvation-streamermode');
        const authorInput = document.getElementById('salvation-author');
        const channelInput = document.getElementById('salvation-channel');
        const logArea = document.getElementById('salvation-logarea');
        if (streamer && streamer.checked) {
            if (authorInput) authorInput.type = 'password';
            if (channelInput) channelInput.type = 'password';
            if (logArea) {
                logArea.style.filter = 'blur(6px)';
                logArea.style.pointerEvents = 'none';
                logArea.style.userSelect = 'none';
                logArea.setAttribute('aria-label', 'Streamer Mode enabled - log hidden');
            }
        } else {
            if (authorInput) authorInput.type = 'text';
            if (channelInput) channelInput.type = 'text';
            fillIdsFromUrl();
            if (logArea) {
                logArea.style.filter = '';
                logArea.style.pointerEvents = '';
                logArea.style.userSelect = '';
                logArea.removeAttribute('aria-label');
            }
        }
    }
    setTimeout(() => {
        const streamer = document.getElementById('salvation-streamermode');
        if (streamer) streamer.addEventListener('change', updateStreamerModeUI);
    }, 1000);


    (function() {
        const origLog = console.log;
        const origErr = console.error;
        const origWarn = console.warn;
        const origInfo = console.info;
        function isStreamer() {
            return document.getElementById('salvation-streamermode')?.checked;
        }
        console.log = function(...args) {
            if (isStreamer()) return;
            origLog.apply(console, args);
        };
        console.error = function(...args) {
            if (isStreamer()) return;
            origErr.apply(console, args);
        };
        console.warn = function(...args) {
            if (isStreamer()) return;
            origWarn.apply(console, args);
        };
        console.info = function(...args) {
            if (isStreamer()) return;
            origInfo.apply(console, args);
        };
    })();

    let queue = [];
    let queueStatus = [];
    function renderQueue() {
      const queueListDiv = document.getElementById('salvation-channel-queue-list');
      if (!queueListDiv) return;
      while (queueStatus.length < queue.length) queueStatus.push('');
      while (queueStatus.length > queue.length) queueStatus.pop();
      queueListDiv.innerHTML = '';
      queue.forEach((item, idx) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '8px';
        row.style.marginBottom = '6px';
        row.innerHTML = `
          <input class=\"salvation-input\" type=\"text\" value=\"${item.channelId}\" placeholder=\"Channel ID\" style=\"flex:1;\">
          <label class=\"salvation-checkbox-label\"><input type=\"checkbox\" ${item.alert ? 'checked' : ''}>Alert</label>
          <button class=\"salvation-btn\" style=\"padding:2px 8px;font-size:13px;\" data-remove=\"${idx}\">Delete</button>
        `;
        const inputEl = row.querySelector('input[type="text"]');
        if (queueStatus[idx] === 'done') {
          inputEl.style.background = '#22c55e';
          inputEl.style.color = '#fff';
        } else {
          inputEl.style.background = '';
          inputEl.style.color = '';
        }
        row.querySelector('input[type="text"]').oninput = (e) => {
          queue[idx].channelId = e.target.value.trim();
          renderQueue();
        };
        row.querySelector('input[type="checkbox"]').onchange = (e) => {
          queue[idx].alert = e.target.checked;
        };
        row.querySelector('button[data-remove]').onclick = () => {
          queue.splice(idx, 1);
          queueStatus.splice(idx, 1);
          renderQueue();
        };
        queueListDiv.appendChild(row);
      });
    }

    setTimeout(() => {
      const textarea = document.getElementById('salvation-channel-queue');
      const queueListDiv = document.getElementById('salvation-channel-queue-list');
      if (!textarea || !queueListDiv) return;

      function addFromTextarea() {
        const lines = textarea.value.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
        if (!lines.length) return;
        let added = false;
        for (const id of lines) {
          if (id && !queue.some(q => q.channelId === id)) {
            queue.push({ channelId: id, alert: true });
            queueStatus.push('');
            added = true;
          }
        }
        if (added) {
          renderQueue();
        }
        textarea.value = '';
      }
      textarea.addEventListener('input', () => {
        addFromTextarea();
      });
      renderQueue();
    }, 1000);

})();