
# 客戶基本資料

請填寫基本資料。

<ClientProfile />

來源：<a type="primary" href="https://data.gov.tw/dataset/39493"
                                target="_blank">國家發展委員會
                                - 預期壽命推估</a>


## 退休金缺口：被低估的長壽風險與 4% 法則的迷思

退休金儲蓄不足是國人普遍低估的議題，在 FIRE（財務自由、提早退休）風潮盛行後，此現象尤為顯著。許多 FIRE 相關書籍推廣以「4% 法則」作為退休提領的標準，然而這類簡化模型往往未充分納入長期通貨膨脹的侵蝕，以及醫療技術進步帶來的額外開支。這種過於樂觀的推算，正導致許多人嚴重低估了「活得太久，錢卻不夠用」的長壽風險。

<RetirementUnderestimationCard />

<script setup>
import ClientProfile from '@/components/templates/ClientProfile.vue'
import RetirementUnderestimationCard from '@/components/organisms/RetirementUnderestimationCard.vue'
</script>