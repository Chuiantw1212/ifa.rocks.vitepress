import { unref, type Ref } from 'vue'

// 定義一個自訂型別，允許傳入純數字 (number) 或 Vue 的響應式數字 (Ref<number>)
type Numberish = number | Ref<number>

export function useTVM() {
    /**
     * 1. 求終值 (Future Value, FV)
     * 用途：計算單筆本金加上定期定額投入，在未來會變成多少錢 (例如：存教育金、資產增值)
     * @param rate - 期利率 (例：年息 5% 帶入 0.05，若算月需除以 12)
     * @param nper - 總期數
     * @param pmt  - 每期投入金額
     * @param pv   - 期初本金 (預設 0)
     */
    const calcFV = (rate: Numberish, nper: Numberish, pmt: Numberish, pv: Numberish = 0): number => {
        const r = unref(rate)
        const n = unref(nper)
        const p = unref(pmt)
        const present = unref(pv)

        if (r === 0) return present + p * n
        return present * Math.pow(1 + r, n) + p * ((Math.pow(1 + r, n) - 1) / r)
    }

    /**
     * 2. 求現值 (Present Value, PV)
     * 用途：計算未來要持續領取一筆錢，現在需要準備多少總本金 (例如：退休金庫總額)
     * @param rate - 期利率
     * @param nper - 總期數
     * @param pmt  - 每期領取金額
     */
    const calcPV = (rate: Numberish, nper: Numberish, pmt: Numberish): number => {
        const r = unref(rate)
        const n = unref(nper)
        const p = unref(pmt)

        if (r === 0) return p * n
        return p * ((1 - Math.pow(1 + r, -n)) / r)
    }

    /**
     * 3. 求每期投入金額 (Payment, PMT for FV)
     * 用途：為了在未來存到一筆目標金額，現在每期需要存多少錢 (例如：為了存 2000 萬買房，每月要存多少)
     * @param rate - 期利率
     * @param nper - 總期數
     * @param fv   - 目標終值
     */
    const calcPMT = (rate: Numberish, nper: Numberish, fv: Numberish): number => {
        const r = unref(rate)
        const n = unref(nper)
        const future = unref(fv)

        if (r === 0) return future / n
        return future * (r / (Math.pow(1 + r, n) - 1))
    }

    /**
     * 4. 求每期攤還/提領金額 (Payment, PMT for PV)
     * 用途：已知一筆總資金/總欠款，分期攤還或提領，每期是多少錢 (例如：房貸月付金、退休金每月可領多少)
     * @param rate - 期利率
     * @param nper - 總期數
     * @param pv   - 目前總本金或貸款總額
     */
    const calcPMTforPV = (rate: Numberish, nper: Numberish, pv: Numberish): number => {
        const r = unref(rate)
        const n = unref(nper)
        const present = unref(pv)

        if (r === 0) return present / n
        return present * (r / (1 - Math.pow(1 + r, -n)))
    }

    return {
        calcFV,
        calcPV,
        calcPMT,
        calcPMTforPV
    }
}