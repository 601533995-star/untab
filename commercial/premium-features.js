/**
 * Untab Pro - Premium Features & Licensing System
 * 浏览器生产力工具的商业化版本
 */

class UnTabProLicensing {
    constructor() {
        this.apiEndpoint = 'https://api.untab-pro.com/v1';
        this.licenseKey = localStorage.getItem('untab-pro-license');
        this.features = {
            free: {
                maxTabs: 20,
                maxGroups: 3,
                searchHistory: false,
                cloudSync: false,
                analytics: false,
                autoSave: false,
                advancedFilters: false,
                teamSharing: false,
                customThemes: false,
                priority_support: false
            },
            pro: {
                maxTabs: 500,
                maxGroups: 20,
                searchHistory: true,
                cloudSync: true,
                analytics: true,
                autoSave: true,
                advancedFilters: true,
                teamSharing: false,
                customThemes: true,
                priority_support: true,
                monthly_price: 9.99
            },
            team: {
                maxTabs: -1, // unlimited
                maxGroups: -1, // unlimited
                searchHistory: true,
                cloudSync: true,
                analytics: true,
                autoSave: true,
                advancedFilters: true,
                teamSharing: true,
                customThemes: true,
                priority_support: true,
                monthly_price: 29.99
            }
        };
        this.currentTier = 'free';
        this.init();
    }

    async init() {
        await this.validateLicense();
        this.injectPremiumUI();
        this.setupFeatureGates();
        this.trackUsage();
    }

    // 许可证验证
    async validateLicense() {
        if (!this.licenseKey) {
            this.currentTier = 'free';
            return;
        }

        try {
            const response = await fetch(`${this.apiEndpoint}/license/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ licenseKey: this.licenseKey })
            });

            const result = await response.json();
            if (result.valid) {
                this.currentTier = result.tier;
                this.expiryDate = result.expiry;
            } else {
                this.currentTier = 'free';
                localStorage.removeItem('untab-pro-license');
            }
        } catch (error) {
            console.warn('License validation failed, using free tier');
            this.currentTier = 'free';
        }
    }

    // 功能门控
    checkFeature(featureName) {
        return this.features[this.currentTier][featureName] || false;
    }

    canAddTab() {
        const maxTabs = this.features[this.currentTier].maxTabs;
        const currentTabs = document.querySelectorAll('.tab').length;
        
        if (maxTabs === -1) return true; // unlimited
        return currentTabs < maxTabs;
    }

    canAddGroup() {
        const maxGroups = this.features[this.currentTier].maxGroups;
        const currentGroups = document.querySelectorAll('.group').length;
        
        if (maxGroups === -1) return true; // unlimited
        return currentGroups < maxGroups;
    }

    // 使用统计
    trackUsage() {
        if (!this.checkFeature('analytics')) return;

        const usage = {
            tabsOpened: 0,
            groupsCreated: 0,
            searchesPerformed: 0,
            timeSpent: 0
        };

        // 统计标签页操作
        document.addEventListener('tab-created', () => {
            usage.tabsOpened++;
            this.sendAnalytics('tab_created', usage);
        });

        // 统计分组操作  
        document.addEventListener('group-created', () => {
            usage.groupsCreated++;
            this.sendAnalytics('group_created', usage);
        });

        // 时间统计
        const startTime = Date.now();
        window.addEventListener('beforeunload', () => {
            usage.timeSpent = Date.now() - startTime;
            this.sendAnalytics('session_end', usage);
        });
    }

    // 云同步功能
    async syncToCloud() {
        if (!this.checkFeature('cloudSync')) {
            this.showUpgradeModal('云同步功能需要升级到Pro版本');
            return false;
        }

        try {
            const data = this.exportCurrentSession();
            const response = await fetch(`${this.apiEndpoint}/sync/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.licenseKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data })
            });

            return response.ok;
        } catch (error) {
            console.error('Cloud sync failed:', error);
            return false;
        }
    }

    // 高级搜索过滤
    setupAdvancedFilters() {
        if (!this.checkFeature('advancedFilters')) {
            // 隐藏高级过滤选项
            document.querySelectorAll('.advanced-filter').forEach(el => {
                el.style.display = 'none';
            });
            return;
        }

        // 启用高级过滤功能
        this.enableDateRangeFilter();
        this.enableDomainFilter();
        this.enableTagFilter();
        this.enableBookmarkFilter();
    }

    enableDateRangeFilter() {
        const filterContainer = document.querySelector('.search-filters');
        const dateFilter = document.createElement('div');
        dateFilter.className = 'date-range-filter';
        dateFilter.innerHTML = `
            <label>时间范围：</label>
            <select id="date-range">
                <option value="all">全部</option>
                <option value="today">今天</option>
                <option value="week">本周</option>
                <option value="month">本月</option>
                <option value="custom">自定义</option>
            </select>
        `;
        filterContainer.appendChild(dateFilter);
    }

    // 团队共享功能
    async shareWithTeam(tabData, teamMembers) {
        if (!this.checkFeature('teamSharing')) {
            this.showUpgradeModal('团队共享功能需要升级到Team版本');
            return false;
        }

        try {
            const response = await fetch(`${this.apiEndpoint}/team/share`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.licenseKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tabData, teamMembers })
            });

            return response.ok;
        } catch (error) {
            console.error('Team sharing failed:', error);
            return false;
        }
    }

    // 升级提示模态框
    showUpgradeModal(message) {
        const modal = document.createElement('div');
        modal.className = 'upgrade-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <h3>🚀 升级到Untab Pro</h3>
                    <p>${message}</p>
                    <div class="pricing-options">
                        <div class="pricing-card pro">
                            <h4>Pro版</h4>
                            <div class="price">¥${this.features.pro.monthly_price}/月</div>
                            <ul>
                                <li>500个标签页管理</li>
                                <li>20个智能分组</li>
                                <li>搜索历史记录</li>
                                <li>云端同步</li>
                                <li>数据分析</li>
                                <li>高级过滤器</li>
                                <li>自定义主题</li>
                                <li>优先支持</li>
                            </ul>
                            <button class="upgrade-btn" onclick="untabPro.purchasePlan('pro')">
                                立即升级
                            </button>
                        </div>
                        <div class="pricing-card team">
                            <h4>Team版</h4>
                            <div class="price">¥${this.features.team.monthly_price}/月</div>
                            <ul>
                                <li>无限标签页管理</li>
                                <li>无限智能分组</li>
                                <li>团队协作共享</li>
                                <li>所有Pro功能</li>
                                <li>团队管理面板</li>
                                <li>专属客户经理</li>
                            </ul>
                            <button class="upgrade-btn team" onclick="untabPro.purchasePlan('team')">
                                立即升级
                            </button>
                        </div>
                    </div>
                    <button class="close-modal" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // 购买处理
    async purchasePlan(tier) {
        const redirectUrl = `https://checkout.untab-pro.com/${tier}?utm_source=extension&utm_medium=upgrade_modal`;
        window.open(redirectUrl, '_blank');
    }

    // 注入Premium UI元素
    injectPremiumUI() {
        this.addPremiumBadge();
        this.addUpgradeButtons();
        this.addUsageLimits();
    }

    addPremiumBadge() {
        const header = document.querySelector('.app-header');
        if (!header) return;

        const badge = document.createElement('div');
        badge.className = `tier-badge ${this.currentTier}`;
        badge.innerHTML = `
            <span class="tier-text">${this.currentTier.toUpperCase()}</span>
            ${this.currentTier === 'free' ? '<span class="upgrade-hint">升级 Pro</span>' : ''}
        `;
        
        if (this.currentTier === 'free') {
            badge.onclick = () => this.showUpgradeModal('解锁更多强大功能');
        }
        
        header.appendChild(badge);
    }

    addUsageLimits() {
        if (this.currentTier === 'free') {
            const tabContainer = document.querySelector('.tabs-container');
            const usageInfo = document.createElement('div');
            usageInfo.className = 'usage-limits';
            usageInfo.innerHTML = `
                <div class="limit-indicator">
                    <span>标签页: ${document.querySelectorAll('.tab').length}/${this.features.free.maxTabs}</span>
                    <span>分组: ${document.querySelectorAll('.group').length}/${this.features.free.maxGroups}</span>
                </div>
            `;
            tabContainer.insertBefore(usageInfo, tabContainer.firstChild);
        }
    }

    // 数据分析发送
    async sendAnalytics(event, data) {
        if (!this.checkFeature('analytics')) return;

        try {
            await fetch(`${this.apiEndpoint}/analytics`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.licenseKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event,
                    data,
                    timestamp: Date.now(),
                    tier: this.currentTier
                })
            });
        } catch (error) {
            // 静默失败
        }
    }

    // 导出当前会话数据
    exportCurrentSession() {
        return {
            tabs: Array.from(document.querySelectorAll('.tab')).map(tab => ({
                url: tab.dataset.url,
                title: tab.textContent,
                timestamp: tab.dataset.timestamp
            })),
            groups: Array.from(document.querySelectorAll('.group')).map(group => ({
                name: group.textContent,
                tabs: Array.from(group.querySelectorAll('.tab')).map(tab => tab.dataset.url)
            }))
        };
    }

    // 获取当前订阅状态
    getSubscriptionStatus() {
        return {
            tier: this.currentTier,
            features: this.features[this.currentTier],
            expiryDate: this.expiryDate,
            isExpired: this.expiryDate && new Date(this.expiryDate) < new Date()
        };
    }
}

// 添加CSS样式
const premiumStyles = `
    <style>
        .tier-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .tier-badge.free {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
        }
        
        .tier-badge.pro {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
        }
        
        .tier-badge.team {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
            color: white;
        }
        
        .tier-badge:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        .upgrade-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
        }
        
        .modal-overlay {
            background: rgba(0,0,0,0.8);
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .modal-content {
            background: white;
            border-radius: 16px;
            padding: 32px;
            max-width: 800px;
            width: 90%;
            max-height: 80%;
            overflow-y: auto;
            position: relative;
        }
        
        .close-modal {
            position: absolute;
            top: 16px;
            right: 20px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #999;
        }
        
        .pricing-options {
            display: flex;
            gap: 24px;
            margin-top: 24px;
        }
        
        .pricing-card {
            flex: 1;
            border: 2px solid #e1e5e9;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
        }
        
        .pricing-card.team {
            border-color: #43e97b;
            position: relative;
        }
        
        .pricing-card h4 {
            font-size: 20px;
            margin-bottom: 8px;
        }
        
        .price {
            font-size: 28px;
            font-weight: bold;
            color: #4facfe;
            margin-bottom: 16px;
        }
        
        .pricing-card ul {
            text-align: left;
            margin-bottom: 24px;
            list-style: none;
            padding: 0;
        }
        
        .pricing-card li {
            padding: 4px 0;
            padding-left: 20px;
            position: relative;
        }
        
        .pricing-card li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #43e97b;
            font-weight: bold;
        }
        
        .upgrade-btn {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            transition: all 0.3s ease;
        }
        
        .upgrade-btn.team {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }
        
        .upgrade-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(79, 172, 254, 0.3);
        }
        
        .usage-limits {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
        }
        
        .limit-indicator {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            color: #666;
        }
        
        .advanced-filter {
            display: none;
        }
    </style>
`;

// 注入样式
document.head.insertAdjacentHTML('beforeend', premiumStyles);

// 初始化Premium功能
const untabPro = new UnTabProLicensing();

// 全局暴露以便在其他脚本中使用
window.untabPro = untabPro;

console.log('🚀 Untab Pro系统已加载');