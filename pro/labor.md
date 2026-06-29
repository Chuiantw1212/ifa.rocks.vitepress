# 勞保與勞退

## 勞工退休金

## 勞工保險

<el-divider>現有資產明細 (PV)</el-divider>
            <el-row :gutter="20">
                <el-col :span="12" :xs="24">
                    <el-form-item label="雇主提繳-累計金額">
                        <el-input-number v-model="model.laborPension.employerContribution" :min="0" :step="10000"
                            style="width: 100%" />
                    </el-form-item>
                </el-col>
                <el-col :span="12" :xs="24">
                    <el-form-item label="個人自提-累計金額">
                        <el-input-number v-model="model.laborPension.personalContribution" :min="0" :step="10000"
                        style="width: 100%" />
                    </el-form-item>
                </el-col>
                <el-col :span="12" :xs="24">
                    <el-form-item label="雇主提繳-累計收益">
                        <el-input-number v-model="model.laborPension.employerEarnings" :min="0" :step="5000"
                            style="width: 100%" />
                    </el-form-item>
                </el-col>
                <el-col :span="12" :xs="24">
                    <el-form-item label="個人自提-累計收益">
                        <el-input-number v-model="model.laborPension.personalEarnings" :min="0" :step="5000"
                            style="width: 100%" />
                    </el-form-item>
                </el-col>
            </el-row>