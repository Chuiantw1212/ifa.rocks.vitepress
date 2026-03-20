<template>
    <el-card shadow="never">
        <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: bold; font-size: 16px;">基本資料與參數 (Profile)</span>

                <el-space alignment="center">

                    <el-upload ref="uploadRef" v-model:file-list="fileList" :limit="1" :show-file-list="false"
                        accept=".json" :auto-upload="false" :on-change="handleFileChange" :on-exceed="handleExceed"
                        style="display: flex;">
                        <el-button type="info" plain link size="small" icon="Upload">
                            匯入設定
                        </el-button>
                    </el-upload>

                    <el-divider direction="vertical" />

                    <el-button v-if="!user.uid" type="primary" size="small" round @click="openSignInDialog">
                        會員登入
                    </el-button>

                    <el-button v-else type="danger" size="small" plain round @click="logout">
                        登出
                    </el-button>
                </el-space>
            </div>
        </template>

        <el-row :gutter="40" align="top">

            <el-col :sm="8" :xs="24" style="text-align: center; margin-bottom: 20px;">
                <div style="padding-top: 10px;">

                    <el-avatar :size="90" :src="user.photoUrl"
                        style="border: 3px solid var(--el-border-color-lighter); box-shadow: var(--el-box-shadow-light);">
                        <span style="font-size: 32px; font-weight: bold;">{{ avatarText }}</span>
                    </el-avatar>

                    <div style="margin-top: 15px;">
                        <el-text size="large" tag="b" style="display: block; margin-bottom: 4px;">
                            {{ user.displayName || '訪客' }}
                        </el-text>

                        <el-tag v-if="user.email" type="info" effect="light" round size="default">
                            {{ user.email }}
                        </el-tag>
                        <el-text v-else type="info" size="small">
                            本地模式
                        </el-text>
                    </div>
                </div>
            </el-col>

            <el-col :sm="16" :xs="24">
                <el-form ref="ruleFormRef" label-position="top" :model="profile" size="large">
                    <el-row :gutter="20">

                        <el-col :span="12" :xs="24">
                            <el-form-item label="出生日期 (Birthday)" required>
                                <el-date-picker v-model="profile.birthDate" type="date" placeholder="請選擇生日"
                                    format="YYYY/MM/DD" value-format="YYYY-MM-DD" :disabled-date="disableFutureDates"
                                    @change="handleBirthdayChange" style="width: 100%" />
                            </el-form-item>
                        </el-col>

                        <el-col :span="12" :xs="24">
                            <el-form-item label="試算年齡 (Age)">
                                <el-input :disabled="true"
                                    :value="profile.currentAge ? profile.currentAge + ' 歲' : '-'">
                                    <template #prefix>
                                        <el-icon>
                                            <User />
                                        </el-icon>
                                    </template>
                                </el-input>
                            </el-form-item>
                        </el-col>

                        <el-col :span="12" :xs="24">
                            <el-form-item label="生理性別 (Gender)" required>
                                <el-select v-model="profile.gender" placeholder="請選擇" style="width: 100%"
                                    @change="handleUpdate">
                                    <el-option v-for="item in metadata?.opt_gender?.list" :key="item.code"
                                        :label="item.label" :value="item.code" />
                                </el-select>
                            </el-form-item>
                        </el-col>

                        <el-col :span="12" :xs="24">
                            <el-form-item label="職業保險 (Insurance)" required>
                                <el-select v-model="profile.careerInsuranceType" placeholder="投保類型" style="width: 100%"
                                    @change="handleUpdate">
                                    <el-option v-for="item in metadata?.opt_social_security?.list" :key="item.code"
                                        :label="item.label" :value="item.code" :disabled="item.disabled" />
                                </el-select>
                            </el-form-item>
                        </el-col>

                        <el-col :span="12" :xs="24">
                            <el-form-item label="預估通膨 (Inflation)">
                                <el-input readonly :value="'3%'" :disabled="true">
                                    <template #prefix>
                                        <el-icon>
                                            <TrendCharts />
                                        </el-icon>
                                    </template>
                                </el-input>
                            </el-form-item>
                        </el-col>

                    </el-row>
                </el-form>
            </el-col>
        </el-row>

        <template #footer>
            <el-collapse accordion>
                <el-collapse-item name="1">
                    <template #title>
                        <el-icon style="margin-right: 5px;">
                            <InfoFilled />
                        </el-icon> 試算參數與資料來源說明
                    </template>
                    <ul style="padding-left: 20px; line-height: 1.8; color: var(--el-text-color-regular);">
                        <li>所有功能不須登入也可以用，登入註冊只是比較方便而已。</li>
                        <li>預期餘命：<el-link type="primary" href="https://data.gov.tw/dataset/39493"
                                target="_blank">國家發展委員會
                                - 預期壽命推估</el-link>
                        </li>
                        <li>通貨膨脹(消費者物價指數年增率)：<el-link type="primary"
                                href="https://www.stat.gov.tw/Point.aspx?sid=t.2&n=3581&sms=11480"
                                target="_blank">中華民國統計資訊網</el-link></li>
                        <li>公教人員年金改革到一半，目前沒人知道公保會怎麼調整。</li>
                    </ul>
                </el-collapse-item>
            </el-collapse>
        </template>
    </el-card>
</template>

<script setup lang="ts">
// 之後會在這裡加入邏輯
import { ref } from 'vue'

// 使用 UserProfile 介面來定義 profile 響應式物件的型別
const profile = ref<UserProfile>({
    birthDate: '', // YYYY-MM-DD
    gender: 'MALE',
    currentAge: 0,
    lifeExpectancy: 81, // 根據國發會平均值
    marriageYear: 0,
    careerInsuranceType: 'LABOR',
    biography: '',
})
</script>

<style scoped>
.user-profile {
  margin-top: 20px;
}
</style>