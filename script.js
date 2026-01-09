document.addEventListener('DOMContentLoaded', function() {
    const messageForm = document.getElementById('messageForm');
    const messagesList = document.getElementById('messagesList');
    const emptyMessage = document.getElementById('emptyMessage');
    const errorDiv = document.getElementById('error-message');
    
    const STUDENT_ID = '239210306';
    
    // 加载留言
    loadMessages();
    
    // 表单提交
    messageForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const nickname = document.getElementById('nickname').value.trim() || '小猫咪';
        const content = document.getElementById('content').value.trim();
        
        // 输入验证
        if (!content) {
            showError('请输入留言内容哦～猫咪想听听你的故事');
            return;
        }
        
        if (content.length > 500) {
            showError('留言太长啦～猫咪记不住那么多呢（最多500字）');
            return;
        }
        
        // 清空错误提示
        clearError();
        
        try {
            const response = await fetch(`/${STUDENT_ID}/api/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nickname, content })
            });
            
            if (response.ok) {
                const newMessage = await response.json();
                addMessageToDOM(newMessage);
                messageForm.reset();
                emptyMessage.style.display = 'none';
            } else {
                showError('发布失败，请稍后再试');
            }
        } catch (error) {
            showError('网络错误，请检查连接');
        }
    });
    
    // 加载留言函数
    async function loadMessages() {
        try {
            const response = await fetch(`/${STUDENT_ID}/api/messages`);
            if (response.ok) {
                const messages = await response.json();
                displayMessages(messages);
            }
        } catch (error) {
            console.error('加载留言失败:', error);
        }
    }
    
    // 显示留言
    function displayMessages(messages) {
        messagesList.innerHTML = '';
        
        if (messages.length === 0) {
            emptyMessage.style.display = 'block';
            return;
        }
        
        emptyMessage.style.display = 'none';
        messages.forEach(message => {
            addMessageToDOM(message);
        });
    }
    
    // 添加留言到DOM
    function addMessageToDOM(message) {
        const messageCard = document.createElement('div');
        messageCard.className = 'message-card';
        messageCard.dataset.id = message.id;
        
        messageCard.innerHTML = `
            <div class="message-header">
                <div class="nickname">${escapeHTML(message.nickname)}</div>
                <div class="time">${message.time}</div>
            </div>
            <div class="content">${escapeHTML(message.content)}</div>
            <button class="like-button" onclick="likeMessage(${message.id})">
                👍 <span id="like-${message.id}">${message.likes}</span>
            </button>
        `;
        
        // 插入到最前面
        if (messagesList.firstChild) {
            messagesList.insertBefore(messageCard, messagesList.firstChild);
        } else {
            messagesList.appendChild(messageCard);
        }
    }
    
    // 点赞函数（全局可访问）
    window.likeMessage = async function(id) {
        try {
            const response = await fetch(`/${STUDENT_ID}/api/like/${id}`, {
                method: 'POST'
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // 更新点赞数
                const likeSpan = document.getElementById(`like-${id}`);
                if (likeSpan) {
                    likeSpan.textContent = result.likes;
                }
                
                // 添加点赞动画
                const button = document.querySelector(`[onclick="likeMessage(${id})"]`);
                button.classList.add('liked');
                setTimeout(() => {
                    button.classList.remove('liked');
                }, 500);
            }
        } catch (error) {
            console.error('点赞失败:', error);
        }
    };
    
    // 显示错误
    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
    
    // 清空错误
    function clearError() {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
    }
    
    // HTML转义防止XSS
    function escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});