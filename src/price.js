import Vue from 'vue'
import VueRouter from 'vue-router'
import Vuex from 'vuex'

Vue.use(Vuex)
Vue.use(VueRouter)
Vue.config.productionTip = false

import App from './App.vue'

const el = '#price-app-root'
const $el = document.querySelector(el)

function calc(state, value) {
	const result = (state.mode === 'euro')
		? Number(value) + Number(state.amount)
		: Number(value) * (1 + (Number(state.amount) / 100))

	//console.log(value, state.mode, state.amount, result)
	return parseFloat(result).toFixed(2)
}

function importData(state) {

	if (!state.imp.trim()) return

	const lines = state.imp
		.replace(/,/g, '.')
		.split('\n')
		.map(l => l.split('\t'))
		.reduce((acc, next) => {
			acc[next[0]] = {
				regular: parseFloat(next[2]).toFixed(2),
				promo: parseFloat(next[3]).toFixed(2),
			}
			return acc
		}, {})

	state.products = state.products.map(p => {
		const id = p.id
		const newValue = lines[id]
		if (!newValue) return p

		if (newValue.regular) p.new_regular = newValue.regular
		if (newValue.promo) p.new_promo = newValue.promo

		return p
	})
}


const store = new Vuex.Store({
	strict: true,

	state: {
		processing: false,
		loaded: false,
		id: parseInt($el.dataset.postId, 10),
		amount: null,
		mode: 'euro',
		field: 'all',
		imp: '',
		products: []
	},

	mutations: {
		setProducts: (state, products) => {
			state.loaded = true

			state.products = products.map(p => {
				p.regular = Number(p.regular).toFixed(2)
				p.promo = Number(p.promo).toFixed(2)
				return p
			})
		},

		simulate: (state) => {
			//console.log('Simualte', state.amount, state.mode, state.field)

			state.products = state.products.map(p => {
				if (!p.active) return p

				p.new_regular = state.field === 'all' || state.field === 'regular'
					? calc(state, p.regular)
					: null

				p.new_promo = state.field === 'all' || state.field === 'discount'
					? calc(state, p.promo)
					: null

				return p
			})

			importData(state)
		},

		updateAmount: (state, amount) => {
			amount = parseFloat(amount)
			state.amount = amount || ''
		},

		updateMode: (state, mode) => {
			state.mode = mode
		},

		updateField: (state, field) => {
			state.field = field
		},

		updateImport: (state, imp) => {
			state.imp = imp
		},

		allToggle: (state) => {
			state.products = state.products.map(p => {
				p.active = !p.active
				return p
			})
		},

		toggle: (state, id) => {
			state.products = state.products.map(p => {
				if (p.id === id) p.active = !p.active
				return p
			})
		},

		batchToggle: (state, ids) => {
			state.products = state.products.map(p => {
				if (ids.indexOf(p.id) > -1) p.active = true
				return p
			})
		},

		clear: (state) => {
			state.products = state.products.map(p => {
				p.active = false
				return p
			})
		},

		setProcessing: (state, processing) => {
			state.processing = processing
		}
	},

	actions: {
		setProducts(context, products) {
			context.commit('setProducts', products)
			context.commit('simulate')
		},

		updateAmount(context, v) {
			context.commit('updateAmount', v)
			context.commit('simulate')
		},

		updateMode(context, v) {
			context.commit('updateMode', v)
			context.commit('simulate')
		},

		updateField(context, v) {
			context.commit('updateField', v)
			context.commit('simulate')
		},

		updateImport(context, v) {
			context.commit('updateImport', v)
			context.commit('simulate')
		},

		allToggle(context) {
			context.commit('allToggle')
			context.commit('simulate')
		},

		toggle(context, v) {
			context.commit('toggle', v)
			context.commit('simulate')
		},

		batchToggle(context, ids) {
			context.commit('batchToggle', ids)
			context.commit('simulate')
		},

		setProcessing(context, processing) {
			context.commit('setProcessing', processing)
		},

		clear(context, v) {
			context.commit('clear', v)
			context.commit('simulate')
		},
	}
})

const router = new VueRouter({
	routes: []
})

new Vue({
	router,
	store,
	components: {
		App
	},

	el,
	template: '<App/>'

})