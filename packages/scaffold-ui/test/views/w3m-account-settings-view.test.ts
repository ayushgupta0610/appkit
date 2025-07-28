import { fixture } from '@open-wc/testing'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { html } from 'lit'

import { ConstantsUtil as CommonConstantsUtil, type CaipNetwork } from '@reown/appkit-common'
import {
  AccountController,
  ChainController,
  ConnectorController,
  OptionsController,
  getPreferredAccountType,
  type AuthConnector,
  type AccountControllerState,
  type ChainControllerState,
  type OptionsControllerState
} from '@reown/appkit-controllers'
import { W3mFrameRpcConstants } from '@reown/appkit-wallet/utils'

import { W3mAccountSettingsView } from '../../src/views/w3m-account-settings-view/index.js'
import { HelpersUtil } from '../utils/HelpersUtil'

// Mock the getPreferredAccountType function
vi.mock('@reown/appkit-controllers', async () => {
  const actual = await vi.importActual('@reown/appkit-controllers')
  return {
    ...actual,
    getPreferredAccountType: vi.fn()
  }
})

// --- Constants ---------------------------------------------------- //
const TOGGLE_BUTTON_TEST_ID = 'account-toggle-preferred-account-type'

const mockCaipNetwork = {
  id: 1,
  name: 'Ethereum',
  chainNamespace: 'eip155',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://ethereum.rpc.com'] } }
} as CaipNetwork

const mockAuthConnector = {
  id: CommonConstantsUtil.CONNECTOR_ID.AUTH,
  type: 'AUTH',
  name: 'Auth',
  provider: {
    getEmail: vi.fn().mockReturnValue('test@example.com')
  }
} as AuthConnector

// Mock ResizeObserver
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

describe('W3mAccountSettingsView - Smart Account Toggle', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks()

    // Mock AccountController
    vi.spyOn(AccountController, 'state', 'get').mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      profileImage: undefined,
      profileName: undefined,
      currentTab: 0,
      addressLabels: new Map()
    } as AccountControllerState)
    vi.spyOn(AccountController, 'subscribe').mockReturnValue(vi.fn())

    // Mock ChainController  
    vi.spyOn(ChainController, 'state', 'get').mockReturnValue({
      activeCaipNetwork: mockCaipNetwork,
      activeChain: 'eip155',
      activeCaipAddress: undefined,
      chains: new Map(),
      universalAdapter: undefined,
      noAdapters: false
    } as ChainControllerState)
    vi.spyOn(ChainController, 'subscribeKey').mockReturnValue(vi.fn())
    vi.spyOn(ChainController, 'checkIfSmartAccountEnabled').mockReturnValue(true)
    vi.spyOn(ChainController, 'checkIfNamesSupported').mockReturnValue(true)

    // Mock ConnectorController
    vi.spyOn(ConnectorController, 'getConnectorId').mockReturnValue(CommonConstantsUtil.CONNECTOR_ID.AUTH)
    vi.spyOn(ConnectorController, 'getAuthConnector').mockReturnValue(mockAuthConnector as AuthConnector)

    // Mock getPreferredAccountType
    vi.mocked(getPreferredAccountType).mockReturnValue(W3mFrameRpcConstants.ACCOUNT_TYPES.SMART_ACCOUNT)

    // Mock OptionsController with subscribe method
    vi.spyOn(OptionsController, 'subscribeKey').mockReturnValue(vi.fn())
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should show smart account toggle when defaultAccountTypes allows smart accounts', async () => {
    // Setup: Configure to allow smart accounts
    vi.spyOn(OptionsController, 'state', 'get').mockReturnValue({
      projectId: 'test-project-id',
      defaultAccountTypes: {
        eip155: 'smartAccount'
      }
    } as OptionsControllerState)

    const element: W3mAccountSettingsView = await fixture(
      html`<w3m-account-settings-view></w3m-account-settings-view>`
    )

    // Wait for element to render
    await element.updateComplete

    const toggleButton = HelpersUtil.getByTestId(element, TOGGLE_BUTTON_TEST_ID)
    expect(toggleButton).toBeTruthy()
  })

  it('should hide smart account toggle when defaultAccountTypes is set to eoa only', async () => {
    // Setup: Configure to only allow EOA accounts
    vi.spyOn(OptionsController, 'state', 'get').mockReturnValue({
      projectId: 'test-project-id',
      defaultAccountTypes: {
        eip155: 'eoa'
      }
    } as OptionsControllerState)

    const element: W3mAccountSettingsView = await fixture(
      html`<w3m-account-settings-view></w3m-account-settings-view>`
    )

    // Wait for element to render
    await element.updateComplete

    const toggleButton = HelpersUtil.getByTestId(element, TOGGLE_BUTTON_TEST_ID)
    expect(toggleButton).toBeFalsy()
  })

  it('should show smart account toggle when defaultAccountTypes is undefined (default behavior)', async () => {
    // Setup: No specific configuration (should default to allowing smart accounts)
    vi.spyOn(OptionsController, 'state', 'get').mockReturnValue({
      projectId: 'test-project-id',
      defaultAccountTypes: {}
    } as OptionsControllerState)

    const element: W3mAccountSettingsView = await fixture(
      html`<w3m-account-settings-view></w3m-account-settings-view>`
    )

    // Wait for element to render
    await element.updateComplete

    const toggleButton = HelpersUtil.getByTestId(element, TOGGLE_BUTTON_TEST_ID)
    expect(toggleButton).toBeTruthy()
  })

  it('should hide smart account toggle when auth connector is not available', async () => {
    // Setup: No auth connector available
    vi.spyOn(ConnectorController, 'getAuthConnector').mockReturnValue(undefined)
    vi.spyOn(OptionsController, 'state', 'get').mockReturnValue({
      projectId: 'test-project-id',
      defaultAccountTypes: {
        eip155: 'smartAccount'
      }
    } as OptionsControllerState)

    const element: W3mAccountSettingsView = await fixture(
      html`<w3m-account-settings-view></w3m-account-settings-view>`
    )

    // Wait for element to render
    await element.updateComplete

    const toggleButton = HelpersUtil.getByTestId(element, TOGGLE_BUTTON_TEST_ID)
    expect(toggleButton).toBeFalsy()
  })

  it('should hide smart account toggle when connector is not AUTH type', async () => {
    // Setup: Different connector type
    vi.spyOn(ConnectorController, 'getConnectorId').mockReturnValue('OTHER_CONNECTOR')
    vi.spyOn(OptionsController, 'state', 'get').mockReturnValue({
      projectId: 'test-project-id',
      defaultAccountTypes: {
        eip155: 'smartAccount'
      }
    } as OptionsControllerState)

    const element: W3mAccountSettingsView = await fixture(
      html`<w3m-account-settings-view></w3m-account-settings-view>`
    )

    // Wait for element to render
    await element.updateComplete

    const toggleButton = HelpersUtil.getByTestId(element, TOGGLE_BUTTON_TEST_ID)
    expect(toggleButton).toBeFalsy()
  })

  it('should hide smart account toggle when smart accounts are not enabled on the network', async () => {
    // Setup: Smart accounts disabled on network
    vi.spyOn(ChainController, 'checkIfSmartAccountEnabled').mockReturnValue(false)
    vi.spyOn(OptionsController, 'state', 'get').mockReturnValue({
      projectId: 'test-project-id',
      defaultAccountTypes: {
        eip155: 'smartAccount'
      }
    } as OptionsControllerState)

    const element: W3mAccountSettingsView = await fixture(
      html`<w3m-account-settings-view></w3m-account-settings-view>`
    )

    // Wait for element to render
    await element.updateComplete

    const toggleButton = HelpersUtil.getByTestId(element, TOGGLE_BUTTON_TEST_ID)
    expect(toggleButton).toBeFalsy()
  })

  it('should respect defaultAccountTypes configuration even when network supports smart accounts', async () => {
    // Setup: Network supports smart accounts but config restricts to EOA
    vi.spyOn(ChainController, 'checkIfSmartAccountEnabled').mockReturnValue(true)
    vi.spyOn(OptionsController, 'state', 'get').mockReturnValue({
      projectId: 'test-project-id',
      defaultAccountTypes: {
        eip155: 'eoa'
      }
    } as OptionsControllerState)

    const element: W3mAccountSettingsView = await fixture(
      html`<w3m-account-settings-view></w3m-account-settings-view>`
    )

    // Wait for element to render
    await element.updateComplete

    const toggleButton = HelpersUtil.getByTestId(element, TOGGLE_BUTTON_TEST_ID)
    
    // Should be hidden due to EOA-only configuration
    expect(toggleButton).toBeFalsy()
  })

  it('should work correctly for different namespaces', async () => {
    // Setup: Different namespace configuration
    vi.spyOn(ChainController, 'state', 'get').mockReturnValue({
      activeCaipNetwork: {
        id: 1,
        chainNamespace: 'solana',
        name: 'Solana',
        nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
        rpcUrls: { default: { http: ['https://solana.rpc.com'] } }
      } as CaipNetwork,
      activeChain: 'solana',
      activeCaipAddress: undefined,
      chains: new Map(),
      universalAdapter: undefined,
      noAdapters: false
    } as ChainControllerState)
    
    vi.spyOn(OptionsController, 'state', 'get').mockReturnValue({
      projectId: 'test-project-id',
      defaultAccountTypes: {
        eip155: 'smartAccount',
        solana: 'eoa'  // Solana only supports EOA
      }
    } as OptionsControllerState)

    const element: W3mAccountSettingsView = await fixture(
      html`<w3m-account-settings-view></w3m-account-settings-view>`
    )

    // Wait for element to render
    await element.updateComplete

    const toggleButton = HelpersUtil.getByTestId(element, TOGGLE_BUTTON_TEST_ID)
    
    // Should be hidden for Solana as configured to EOA only
    expect(toggleButton).toBeFalsy()
  })
})