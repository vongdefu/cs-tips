# VSCode

编辑器直接使用 VSCode；相关的配置可以通过 VSCode 的账号进行不同平台的同步。

主要有以下注意要点：

- 插件；
- 代码片段；
- 用户任务；

## 代码片段

## 用户任务

## 插件及其配置

- markmap 插件的配置： `Markmap:Default Options ： {"initialExpandLevel": 2, "maxWidth": 500}`

## 其它

1. 安装后登录账号会自动同步设置，账号为 GitHub 的账号。
2. 快捷键创建 以时间戳命名的 markdown 文件，用户快速记录一些内容：

   ```json
   {
       "label": "Create and Open Markdown File",
       "type": "shell",
       "command": "bash",	// 表明
       "args": [
           "-c",
           "FILENAME=$(date +'%Y%m%d_%H%M%S').md && FILEPATH=$(cygpath -u \"${workspaceFolder}\") && touch \"$FILEPATH/notes/temp/$FILENAME\" && code \"$FILEPATH/notes/temp/$FILENAME\""
       ],
       "group": {
           "kind": "build",    // Ctrl+Shift+B：此快捷键触发默认的 build 任务，你也可以自定义触发其他快捷键。
           "isDefault": true
       },
       "problemMatcher": []
   }


   // 注意：
   command: 使用 bash 来执行命令。
   cygpath 是 Git Bash 环境下的命令，用于转换 Windows 和 Unix 路径格式。它确保在 Git Bash 中处理路径时，不会因为反斜杠的转义问题导致错误。
   ```

3. 参考： [vscode 设置](https://type.cyhsu.xyz/2023/09/vscode-as-scratchpad/)
