const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const STUDENT_ID = '2021001'; // 替换为你的学号

// 创建子路由器
const router = express.Router();

// 中间件
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 数据库连接
const db = new sqlite3.Database('./treehole.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the treehole database.');
});

// 创建表（含likes字段）
db.run(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nickname TEXT NOT NULL,
        content TEXT NOT NULL,
        time TEXT NOT NULL,
        likes INTEGER DEFAULT 0
    )
`);

// API路由 - 获取所有留言
router.get('/api/messages', (req, res) => {
    const sql = 'SELECT * FROM messages ORDER BY time DESC';
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// API路由 - 发布新留言
router.post('/api/messages', (req, res) => {
    const { nickname, content } = req.body;
    const time = new Date().toLocaleString('zh-CN');
    
    const sql = 'INSERT INTO messages (nickname, content, time) VALUES (?, ?, ?)';
    db.run(sql, [nickname, content, time], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ 
            id: this.lastID,
            nickname,
            content,
            time,
            likes: 0
        });
    });
});

// API路由 - 点赞
router.post('/api/like/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'UPDATE messages SET likes = likes + 1 WHERE id = ?';
    
    db.run(sql, [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // 获取更新后的点赞数
        db.get('SELECT likes FROM messages WHERE id = ?', [id], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ 
                success: true, 
                likes: row.likes,
                id: parseInt(id)
            });
        });
    });
});

// 静态文件服务
router.use(express.static('public'));

// 首页路由
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 挂载子路由
app.use('/' + STUDENT_ID, router);

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}/${STUDENT_ID}`);
    console.log(`Public URL: http://localhost:${PORT}/${STUDENT_ID}`);
});