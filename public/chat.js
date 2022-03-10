class Chat {

    users = [];
    activeChatId = null;
    messages = {}

    constructor({currentUser}) {
        this.currentUser = currentUser;

        this.initChat();
        this.initListeners();
    }

    async initChat() {
        this.$chat = document.querySelector('.chat');
        this.$userList = this.$chat.querySelector('.users-list');
        this.$currentUser = this.$chat.querySelector('.current-user');
        this.$textInput = this.$chat.querySelector('input');
        this.$messagesList = this.$chat.querySelector('.messages-list');

        this.$chat.classList.remove('hidden');
        this.$currentUser.innerText = `Logged in as ${this.currentUser.name}`

        const users = await this.fetchUsers();
        this.renderUsers(users);
    }

    async fetchUsers() {
        const res = await fetch('/users');
        return await res.json();
    }

    renderUsers(users) {
        this.users = users.filter(user => user.id !== socket.id);

        this.$userList.innerHTML = '';
        const $users = this.users.map(user => {
            const $user = document.createElement('div')
            $user.innerText = user.name;
            $user.dataset.id = user.id;

            return $user
        })

        this.$userList.append(...$users);
        this.initUserListeners($users);
    }

    initUserListeners($users) {
        $users.forEach($userElement => {
            $userElement.addEventListener('click', () => {
                this.activateChat($userElement)
            })
        })
    }

    activateChat($userElement) {
        const userId = $userElement.dataset.id;
        if (this.activeChatId) {
            this.$userList.querySelector(`div[data-id="${this.activeChatId}"]`).classList.remove('active')
        }
        this.$userList.querySelector(`div[data-id="${userId}"]`).classList.remove('has-new-notification')
        this.activeChatId = userId;
        $userElement.classList.add('active');
        this.$textInput.classList.remove('hidden')

        this.renderMessage(userId)

        this.$textInput.addEventListener('keyup', e => {
            if (e.key === 'Enter') {
                const message = {
                    text: this.$textInput.value,
                    recipientId: this.activeChatId
                }
                socket.emit('new-chat-message', message);
                this.addMessage(message.text, message.recipientId)
                this.renderMessage(message.recipientId)
                this.$textInput.value = ''
            }
        })
    }

    addMessage(text, recipientId) {
        if (!this.messages[recipientId]) {
            this.messages[recipientId] = []
        }
        this.messages[recipientId].push(text);
    }

    renderMessage(recipientId) {
        this.$messagesList.innerHTML = '';
        if (!this.messages[recipientId]) {
            this.messages[recipientId] = []
        }

        const $messages = this.messages[recipientId].map(message => {
            const $message = document.createElement('div');
            $message.innerText = message;
            return $message
        })

        this.$messagesList.append(...$messages)
    }

    initListeners() {
        socket.on('users-changed', users => {
            this.renderUsers(users)
        })

        socket.on('new-chat-message', message => {
            this.addMessage(message.text, message.senderId)
            if (message.senderId === this.activeChatId) {
                this.renderMessage(message.senderId)
            } else {
                this.showNewNotification(message.senderId)
            }
        })
    }

    showNewNotification(senderId) {
        this.$userList.querySelector(`div[data-id="${senderId}"]`).classList.add('has-new-notification')
    }
}