/**
 * Mock 数据 + 模拟 service
 *
 * 设计：
 * - 与 httpService 同签名，前端原型可独立运行
 * - 后端 ready 后将 .env 中 VITE_USE_MOCK 改为 false，自动切到真实 API
 * - 模拟 WebSocket 新单推送：暴露 subscribeNewOrder，由 composables 调用
 */
import type {
  Order,
  RecipeSnapshot,
  User,
} from '@/shared/types/models'
import { OrderStatus, PaymentStatus, PaymentMethod, PickupMethod } from '@/shared/constants/orderStatus'
import { OrderAction } from '@/shared/constants/orderAction'

// ============ 用户 ============
const MOCK_USER: User = {
  id: 3,
  display_name: '王师傅',
  role: 'KITCHEN',
}

const MOCK_PIN = '123456'

// ============ 配方快照 ============
const MOCK_RECIPES: Record<number, RecipeSnapshot> = {
  1: {
    id: 1,
    menu_item_name: '草莓蛋糕(8寸)',
    version: 2,
    ingredients: [
      { ingredient_name: '低筋面粉', amount: 0.3, unit: 'kg' },
      { ingredient_name: '鸡蛋', amount: 6, unit: '个' },
      { ingredient_name: '草莓', amount: 0.5, unit: 'kg' },
      { ingredient_name: '淡奶油', amount: 400, unit: 'ml' },
      { ingredient_name: '细砂糖', amount: 150, unit: 'g' },
    ],
    steps: [
      { order: 1, text: '蛋黄蛋白分离，蛋黄加 50g 糖打发至浓稠泛白', duration_min: 5 },
      { order: 2, text: '筛入低筋面粉，Z 字拌匀至无颗粒', duration_min: 3 },
      { order: 3, text: '蛋白分次加 100g 糖，打至硬性发泡（小尖角直立）', duration_min: 6 },
      { order: 4, text: '取 1/3 蛋白糊与蛋黄糊翻拌，再倒回蛋白盆翻拌均匀', duration_min: 3 },
      { order: 5, text: '倒入 8 寸模具，震两下排气，160°C 烤 50 分钟', duration_min: 50 },
      { order: 6, text: '出炉倒扣放凉，淡奶油加糖打发，抹面装饰草莓', duration_min: 15 },
    ],
    allergens: ['鸡蛋', '乳制品', '麸质'],
    loss_rate: 0.05,
  },
  2: {
    id: 2,
    menu_item_name: '巧克力蛋糕(6寸)',
    version: 1,
    ingredients: [
      { ingredient_name: '低筋面粉', amount: 0.2, unit: 'kg' },
      { ingredient_name: '鸡蛋', amount: 4, unit: '个' },
      { ingredient_name: '黑巧克力', amount: 150, unit: 'g' },
      { ingredient_name: '淡奶油', amount: 300, unit: 'ml' },
      { ingredient_name: '细砂糖', amount: 120, unit: 'g' },
    ],
    steps: [
      { order: 1, text: '黑巧克力隔水融化至顺滑，保温 40°C', duration_min: 8 },
      { order: 2, text: '蛋黄加糖打散，加入融化的巧克力拌匀', duration_min: 4 },
      { order: 3, text: '蛋白打至硬性发泡，与蛋黄糊翻拌均匀', duration_min: 5 },
      { order: 4, text: '倒入 6 寸模具，170°C 烤 35 分钟', duration_min: 35 },
      { order: 5, text: '放凉后淡奶油打发抹面，撒巧克力屑装饰', duration_min: 12 },
    ],
    allergens: ['鸡蛋', '乳制品', '麸质', '可可'],
    loss_rate: 0.05,
  },
  3: {
    id: 3,
    menu_item_name: '慕斯蛋糕(8寸)',
    version: 1,
    ingredients: [
      { ingredient_name: '淡奶油', amount: 600, unit: 'ml' },
      { ingredient_name: '马斯卡彭', amount: 500, unit: 'g' },
      { ingredient_name: '吉利丁片', amount: 6, unit: '片' },
      { ingredient_name: '细砂糖', amount: 180, unit: 'g' },
      { ingredient_name: '消化饼干', amount: 200, unit: 'g' },
      { ingredient_name: '黄油', amount: 100, unit: 'g' },
    ],
    steps: [
      { order: 1, text: '消化饼干压碎，融化的黄油拌匀，压入模具底部冷藏定型', duration_min: 10 },
      { order: 2, text: '吉利丁片冰水泡软，隔水融化备用', duration_min: 5 },
      { order: 3, text: '马斯卡彭加糖打至顺滑，加入融化的吉利丁拌匀', duration_min: 5 },
      { order: 4, text: '淡奶油打至 7 成发，与芝士糊翻拌均匀', duration_min: 5 },
      { order: 5, text: '倒入模具，冷藏 4 小时以上定型', duration_min: 240 },
      { order: 6, text: '脱模装饰水果即可', duration_min: 5 },
    ],
    allergens: ['乳制品', '麸质'],
    loss_rate: 0.03,
  },
}

// ============ 订单 ============
const now = new Date()
function hoursLater(h: number, m = 0): string {
  const d = new Date(now)
  d.setHours(d.getHours() + h)
  d.setMinutes(d.getMinutes() + m)
  return d.toISOString()
}

const MOCK_ORDERS: Order[] = [
  {
    id: 1,
    order_no: '0630-001',
    order_date: '2026-06-30',
    status: OrderStatus.PENDING,
    customer: { id: 1, display_name: '张三妈', wxid: 'wxid_zhangsanma' },
    menu_item: { id: 1, name: '草莓蛋糕', spec: '8寸', price: 168 },
    quantity: 1,
    pickup_method: PickupMethod.PICKUP,
    pickup_at: hoursLater(2, 30),
    contact_phone: '138****1234',
    order_note: '不要坚果（女儿过敏）',
    payment_status: PaymentStatus.UNPAID,
    total_price: 168,
    customer_notes: [{ id: 1, content: '女儿花生过敏', source: 'ALLERGY' }],
    created_at: hoursLater(0, -3),
  },
  {
    id: 2,
    order_no: '0630-002',
    order_date: '2026-06-30',
    status: OrderStatus.PENDING,
    customer: { id: 2, display_name: '李四', wxid: 'wxid_lisi' },
    menu_item: { id: 2, name: '巧克力蛋糕', spec: '6寸', price: 98 },
    quantity: 2,
    pickup_method: PickupMethod.DELIVERY,
    pickup_at: hoursLater(3),
    contact_phone: '139****5678',
    delivery_address: '槐树街 12 号 3 单元 502 室',
    order_note: '巧克力加量',
    payment_status: PaymentStatus.PAID,
    payment_method: PaymentMethod.WECHAT,
    payment_paid_at: hoursLater(0, -10),
    total_price: 196,
    customer_notes: [],
    created_at: hoursLater(0, -8),
  },
  {
    id: 3,
    order_no: '0630-003',
    order_date: '2026-06-30',
    status: OrderStatus.PENDING,
    customer: { id: 3, display_name: '王五', wxid: 'wxid_wangwu' },
    menu_item: { id: 1, name: '草莓蛋糕', spec: '8寸', price: 168 },
    quantity: 1,
    pickup_method: PickupMethod.PICKUP,
    pickup_at: hoursLater(1, 0),
    contact_phone: '137****8888',
    order_note: '表面写「生日快乐」',
    payment_status: PaymentStatus.UNPAID,
    total_price: 168,
    customer_notes: [],
    created_at: hoursLater(0, -15),
  },
  {
    id: 4,
    order_no: '0630-004',
    order_date: '2026-06-30',
    status: OrderStatus.COOKING,
    customer: { id: 4, display_name: '赵六', wxid: 'wxid_zhaoliu' },
    menu_item: { id: 2, name: '巧克力蛋糕', spec: '6寸', price: 98 },
    quantity: 1,
    pickup_method: PickupMethod.PICKUP,
    pickup_at: hoursLater(1, 30),
    contact_phone: '136****2233',
    order_note: '',
    payment_status: PaymentStatus.UNPAID,
    total_price: 98,
    recipe_snapshot_id: 2,
    customer_notes: [],
    created_at: hoursLater(0, -25),
  },
  {
    id: 5,
    order_no: '0630-005',
    order_date: '2026-06-30',
    status: OrderStatus.COOKING,
    customer: { id: 5, display_name: '孙七', wxid: 'wxid_sunqi' },
    menu_item: { id: 3, name: '慕斯蛋糕', spec: '8寸', price: 188 },
    quantity: 1,
    pickup_method: PickupMethod.DELIVERY,
    pickup_at: hoursLater(2),
    contact_phone: '135****6677',
    delivery_address: '人民路 88 号 星河湾 5 栋 1801',
    order_note: '表面装饰加蓝色水果',
    payment_status: PaymentStatus.PAID,
    payment_method: PaymentMethod.ALIPAY,
    payment_paid_at: hoursLater(0, -30),
    total_price: 188,
    recipe_snapshot_id: 3,
    customer_notes: [{ id: 2, content: '喜欢甜一点', source: 'MANUAL' }],
    created_at: hoursLater(0, -40),
  },
  {
    id: 6,
    order_no: '0630-006',
    order_date: '2026-06-30',
    status: OrderStatus.READY_FOR_PICKUP,
    customer: { id: 1, display_name: '张三妈', wxid: 'wxid_zhangsanma' },
    menu_item: { id: 1, name: '草莓蛋糕', spec: '8寸', price: 168 },
    quantity: 1,
    pickup_method: PickupMethod.PICKUP,
    pickup_at: hoursLater(0, 30),
    contact_phone: '138****1234',
    order_note: '客户提到店时间约 17:30',
    payment_status: PaymentStatus.UNPAID,
    total_price: 168,
    recipe_snapshot_id: 1,
    customer_notes: [{ id: 1, content: '女儿花生过敏', source: 'ALLERGY' }],
    created_at: hoursLater(0, -60),
  },
  {
    id: 7,
    order_no: '0630-007',
    order_date: '2026-06-30',
    status: OrderStatus.READY_FOR_PICKUP,
    customer: { id: 6, display_name: '周八', wxid: 'wxid_zhouba' },
    menu_item: { id: 2, name: '巧克力蛋糕', spec: '6寸', price: 98 },
    quantity: 1,
    pickup_method: PickupMethod.PICKUP,
    pickup_at: hoursLater(0, 45),
    contact_phone: '133****4444',
    order_note: '',
    payment_status: PaymentStatus.PAID,
    payment_method: PaymentMethod.WECHAT,
    payment_paid_at: hoursLater(0, -90),
    total_price: 98,
    recipe_snapshot_id: 2,
    customer_notes: [],
    created_at: hoursLater(0, -120),
  },
  {
    id: 8,
    order_no: '0630-008',
    order_date: '2026-06-30',
    status: OrderStatus.READY_FOR_DELIVERY,
    customer: { id: 7, display_name: '吴九', wxid: 'wxid_wujiu' },
    menu_item: { id: 3, name: '慕斯蛋糕', spec: '8寸', price: 188 },
    quantity: 1,
    pickup_method: PickupMethod.DELIVERY,
    pickup_at: hoursLater(0, 20),
    contact_phone: '132****9999',
    delivery_address: '解放路 200 号 万科城 12 栋 3 单元 1801',
    order_note: '客户备注：不要按门铃，电话联系',
    payment_status: PaymentStatus.UNPAID,
    total_price: 188,
    recipe_snapshot_id: 3,
    customer_notes: [],
    created_at: hoursLater(0, -75),
  },
  {
    id: 9,
    order_no: '0630-009',
    order_date: '2026-06-30',
    status: OrderStatus.READY_FOR_DELIVERY,
    customer: { id: 8, display_name: '郑十', wxid: 'wxid_zhengshi' },
    menu_item: { id: 1, name: '草莓蛋糕', spec: '8寸', price: 168 },
    quantity: 2,
    pickup_method: PickupMethod.DELIVERY,
    pickup_at: hoursLater(0, 60),
    contact_phone: '131****0000',
    delivery_address: '建设街 66 号 2 单元 301',
    order_note: '',
    payment_status: PaymentStatus.PAID,
    payment_method: PaymentMethod.WECHAT,
    payment_paid_at: hoursLater(0, -100),
    total_price: 336,
    recipe_snapshot_id: 1,
    customer_notes: [],
    created_at: hoursLater(0, -110),
  },
]

// ============ 内存 store + 订阅 ============
let orders: Order[] = JSON.parse(JSON.stringify(MOCK_ORDERS))
const newOrderSubscribers = new Set<(order: Order) => void>()
let autoNewOrderTimer: ReturnType<typeof setInterval> | null = null

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

function emitNewOrder(order: Order) {
  newOrderSubscribers.forEach((fn) => fn(order))
}

/** 启动自动新单推送（模拟 WebSocket），每 30-90 秒推送一笔 */
export function startAutoNewOrder() {
  if (autoNewOrderTimer) return
  let seq = 100
  const customers = [
    { id: 20, display_name: '陈十一', wxid: 'wxid_chen11' },
    { id: 21, display_name: '林十二', wxid: 'wxid_lin12' },
    { id: 22, display_name: '黄十三', wxid: 'wxid_huang13' },
  ]
  const menus = [
    { id: 1, name: '草莓蛋糕', spec: '8寸', price: 168, snapshot: 1 },
    { id: 2, name: '巧克力蛋糕', spec: '6寸', price: 98, snapshot: 2 },
    { id: 3, name: '慕斯蛋糕', spec: '8寸', price: 188, snapshot: 3 },
  ]
  const scheduleNext = () => {
    const interval = 30000 + Math.random() * 60000
    autoNewOrderTimer = setTimeout(() => {
      seq += 1
      const c = customers[Math.floor(Math.random() * customers.length)]
      const m = menus[Math.floor(Math.random() * menus.length)]
      const isDelivery = Math.random() > 0.5
      const isPaid = Math.random() > 0.5
      const no = `0630-${String(seq).padStart(3, '0')}`
      const newOrder: Order = {
        id: seq,
        order_no: no,
        order_date: '2026-06-30',
        status: OrderStatus.PENDING,
        customer: c,
        menu_item: m,
        quantity: Math.random() > 0.7 ? 2 : 1,
        pickup_method: isDelivery ? PickupMethod.DELIVERY : PickupMethod.PICKUP,
        pickup_at: hoursLater(2 + Math.floor(Math.random() * 3)),
        contact_phone: '138****' + String(1000 + seq).slice(-4),
        delivery_address: isDelivery ? '新建路 ' + seq + ' 号' : undefined,
        order_note: Math.random() > 0.6 ? '客户备注样例' : '',
        payment_status: isPaid ? PaymentStatus.PAID : PaymentStatus.UNPAID,
        payment_method: isPaid ? PaymentMethod.WECHAT : undefined,
        payment_paid_at: isPaid ? new Date().toISOString() : undefined,
        total_price: m.price * 2,
        customer_notes: [],
        created_at: new Date().toISOString(),
      }
      orders.unshift(newOrder)
      emitNewOrder(newOrder)
      scheduleNext()
    }, interval)
  }
  scheduleNext()
}

export function stopAutoNewOrder() {
  if (autoNewOrderTimer) {
    clearTimeout(autoNewOrderTimer)
    autoNewOrderTimer = null
  }
}

export function subscribeNewOrder(fn: (order: Order) => void): () => void {
  newOrderSubscribers.add(fn)
  return () => newOrderSubscribers.delete(fn)
}

// ============ 模拟 service ============
export const mockService = {
  async login(pin: string, client_type: 'admin' | 'kitchen'): Promise<User> {
    await delay(300)
    if (pin !== MOCK_PIN) {
      throw {
        code: 'UNAUTHORIZED',
        message: 'PIN 码错误',
        httpStatus: 401,
      }
    }
    if (client_type === 'kitchen') {
      sessionStorage.setItem('kitchen_session', 'mock-token-kitchen')
    }
    return MOCK_USER
  },

  async logout(): Promise<void> {
    await delay(100)
    sessionStorage.removeItem('kitchen_session')
  },

  async me(): Promise<User | null> {
    await delay(80)
    if (!sessionStorage.getItem('kitchen_session')) return null
    return MOCK_USER
  },

  async listTodayOrders(): Promise<Order[]> {
    await delay(200)
    return [...orders]
  },

  async getRecipe(menuItemId: number, snapshotId?: number): Promise<RecipeSnapshot> {
    await delay(150)
    if (snapshotId && MOCK_RECIPES[snapshotId]) return MOCK_RECIPES[snapshotId]
    return MOCK_RECIPES[menuItemId] || MOCK_RECIPES[1]
  },

  async action(
    orderId: number,
    action: OrderAction,
    params?: { payment_method?: PaymentMethod },
  ): Promise<Order> {
    await delay(250)
    const idx = orders.findIndex((o) => o.id === orderId)
    if (idx < 0) throw { code: 'ORDER_NOT_FOUND', message: '订单不存在' }
    const order = { ...orders[idx] }

    switch (action) {
      case OrderAction.START_COOKING:
        if (order.status !== OrderStatus.PENDING) {
          throw { code: 'ORDER_STATUS_CONFLICT', message: '当前状态不允许开始制作' }
        }
        order.status = OrderStatus.COOKING
        order.recipe_snapshot_id = order.menu_item.id
        break
      case OrderAction.FINISH:
        if (order.status !== OrderStatus.COOKING) {
          throw { code: 'ORDER_STATUS_CONFLICT', message: '当前状态不允许完工' }
        }
        order.status =
          order.pickup_method === PickupMethod.PICKUP
            ? OrderStatus.READY_FOR_PICKUP
            : OrderStatus.READY_FOR_DELIVERY
        break
      case OrderAction.CLOSE_PICKUP:
        if (order.status !== OrderStatus.READY_FOR_PICKUP) {
          throw { code: 'ORDER_STATUS_CONFLICT', message: '当前状态不允许关闭' }
        }
        order.status = OrderStatus.COMPLETED
        if (order.payment_status === PaymentStatus.UNPAID && params?.payment_method) {
          order.payment_status = PaymentStatus.PAID
          order.payment_method = params.payment_method
          order.payment_paid_at = new Date().toISOString()
        }
        break
      case OrderAction.CLOSE_DELIVERY:
        if (order.status !== OrderStatus.READY_FOR_DELIVERY) {
          throw { code: 'ORDER_STATUS_CONFLICT', message: '当前状态不允许关闭' }
        }
        order.status = OrderStatus.COMPLETED
        if (order.payment_status === PaymentStatus.UNPAID && params?.payment_method) {
          order.payment_status = PaymentStatus.PAID
          order.payment_method = params.payment_method
          order.payment_paid_at = new Date().toISOString()
        }
        break
      default:
        throw { code: 'INTERNAL_ERROR', message: `未实现动作: ${action}` }
    }

    orders[idx] = order
    return order
  },
}
