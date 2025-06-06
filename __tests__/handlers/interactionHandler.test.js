const mockedSelect = jest.fn();
const mockedModal = jest.fn();
const mockedButton = jest.fn();

jest.mock('../../handlers/selectMenus/editCalendarSelect.js', () => mockedSelect, { virtual: true });
jest.mock('../../handlers/modals/editCalendarModal.js', () => mockedModal, { virtual: true });
jest.mock('../../handlers/buttons/scheduleWeekCancel.js', () => mockedButton, { virtual: true });

const handler = require('../../handlers/interactionHandler');

describe('interactionHandler', () => {
  let client;

  beforeEach(() => {
    jest.clearAllMocks();
    client = { commands: new Map() };
  });

  it('executes a chat input command', async () => {
    const cmd = { execute: jest.fn() };
    client.commands.set('ping', cmd);
    const interaction = {
      isChatInputCommand: () => true,
      commandName: 'ping',
      isStringSelectMenu: () => false,
      isModalSubmit: () => false,
      isButton: () => false,
    };
    await handler(client, interaction);
    expect(cmd.execute).toHaveBeenCalledWith(interaction);
  });

  it('replies when command execution fails', async () => {
    const cmd = { execute: jest.fn().mockRejectedValue(new Error('fail')) };
    client.commands.set('ping', cmd);
    const reply = jest.fn();
    const interaction = {
      isChatInputCommand: () => true,
      commandName: 'ping',
      isStringSelectMenu: () => false,
      isModalSubmit: () => false,
      isButton: () => false,
      replied: false,
      deferred: false,
      reply,
    };
    await handler(client, interaction);
    expect(reply).toHaveBeenCalled();
  });

  it('calls select menu handler', async () => {
    const interaction = {
      isChatInputCommand: () => false,
      isStringSelectMenu: () => true,
      customId: 'edit_calendar_select_123',
      isModalSubmit: () => false,
      isButton: () => false,
    };
    await handler(client, interaction);
    expect(mockedSelect).toHaveBeenCalledWith(interaction);
  });

  it('calls modal handler', async () => {
    const interaction = {
      isChatInputCommand: () => false,
      isStringSelectMenu: () => false,
      isModalSubmit: () => true,
      customId: 'edit_calendar_modal_1',
      isButton: () => false,
    };
    await handler(client, interaction);
    expect(mockedModal).toHaveBeenCalledWith(interaction);
  });

  it('calls button handler', async () => {
    const interaction = {
      isChatInputCommand: () => false,
      isStringSelectMenu: () => false,
      isModalSubmit: () => false,
      isButton: () => true,
      customId: 'schedule_week_cancel_1',
    };
    await handler(client, interaction);
    expect(mockedButton).toHaveBeenCalledWith(interaction);
  });

  it('logs warning for missing command', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const interaction = {
      isChatInputCommand: () => true,
      commandName: 'missing',
      isStringSelectMenu: () => false,
      isModalSubmit: () => false,
      isButton: () => false,
    };
    await handler(client, interaction);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('No matching command'));
    warn.mockRestore();
  });

  it('warns when sending error reply fails', async () => {
    const cmd = { execute: jest.fn().mockRejectedValue(new Error('boom')) };
    client.commands.set('fail', cmd);
    const reply = jest.fn(() => Promise.reject(new Error('send fail')));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const interaction = {
      isChatInputCommand: () => true,
      commandName: 'fail',
      isStringSelectMenu: () => false,
      isModalSubmit: () => false,
      isButton: () => false,
      replied: false,
      deferred: false,
      reply,
      followUp: jest.fn(() => Promise.reject(new Error('send fail')))
    };
    await handler(client, interaction);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Failed to send error reply'), expect.any(Error));
    warn.mockRestore();
  });

  it('logs error when select menu handler is missing', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const interaction = {
      isChatInputCommand: () => false,
      isStringSelectMenu: () => true,
      customId: 'unknown_menu',
      isModalSubmit: () => false,
      isButton: () => false,
    };
    await handler(client, interaction);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('No handler for selectMenu'), expect.anything());
    error.mockRestore();
  });

  it('logs error when modal handler is missing', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const interaction = {
      isChatInputCommand: () => false,
      isStringSelectMenu: () => false,
      isModalSubmit: () => true,
      customId: 'unknown_modal',
      isButton: () => false,
    };
    await handler(client, interaction);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('No handler for modal'), expect.anything());
    error.mockRestore();
  });

  it('logs error when button handler is missing', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const interaction = {
      isChatInputCommand: () => false,
      isStringSelectMenu: () => false,
      isModalSubmit: () => false,
      isButton: () => true,
      customId: 'unknown_button',
    };
    await handler(client, interaction);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('No handler for button'), expect.anything());
    error.mockRestore();
  });
});
