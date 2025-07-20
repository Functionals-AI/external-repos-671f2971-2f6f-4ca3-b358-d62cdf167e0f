'use client';

import Banner from '@/modules/banner/banner';
import Container from '@/ui-components/container';
import { useDrawer } from '@/modules/drawer';
import { useModal } from '@/modules/modal';
import { Badge } from '@/ui-components/badge';
import { Button, ButtonSize, ButtonVariant } from '@/ui-components/button';
import IconButton from '@/ui-components/button/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui-components/dropdown-menu';
import Toggle from '@/ui-components/toggle';
import useToaster from 'hooks/useToaster';
import { useState } from 'react';
import RadioGroup from '@/ui-components/radio-and-checkbox/radio';
import Columns from '@/ui-components/columns';
import LinkButton from '@/ui-components/button/link';
import AccordionItem from '@/ui-components/accordion/card-accordion';
import RichText from '@/ui-components/rich-text';
import ButtonBar from '@/ui-components/button/group';
import { SplitButton, SplitButtonItem } from '@/ui-components/button/split';
import { FormV2 } from '@/modules/form/form';
import { Input as BaseInput } from '@/ui-components/form/input';
import FormItem from '@/modules/form/form-item';
import SelectFormItem from '@/modules/form/select-item';
import EditableValue from '@/ui-components/editable-value';
import RadioGroupItemCard from '@/ui-components/radio-and-checkbox/radio/radio-group-item-card';
import RadioGroupItemDefault from '@/ui-components/radio-and-checkbox/radio/radio-group-item-default';
import CheckBox from '@/ui-components/radio-and-checkbox/checkbox';
import StepBar from '@/modules/stepper/step-bar';
import Thread from '@/modules/thread';
import { mockComments } from '@/modules/thread/mock';
import { radioGroupTiered } from '@/modules/widgets/mock/radio-group-tiered';
import { useForm } from 'react-hook-form';
import { type RadioGroupTieredValue } from '@/modules/form/radio-group-tiered';
import { OnAddEntryFn, TFormTableItem } from '@/modules/form/form-table-item';
import { radioGroupTable2 } from '@/modules/widgets/mock/radio-group-table';
import TagInput from '@/ui-components/tag-input';
import FormTagInputItem from '@/modules/form/form-tag-input-item';
import { TagInputOption } from '@/ui-components/tag-input/types';
import Icon from '@/ui-components/icons/Icon';
import FormDatePickerItem from '@/modules/form/form-date-picker-item';
import Section from '@/ui-components/section';
import TimelineVertical from '@/ui-components/timeline-vertical';
function SlotPlaceholder() {
  return (
    <div className="py-20 px-32">
      <div className="h-[400px] w-auto flex justify-center items-center">
        <h2>Slot</h2>
      </div>
    </div>
  );
}

export default function BasicTab() {
  const modal = useModal();
  const toaster = useToaster();
  const drawer = useDrawer();
  const form = useForm();
  const [switchEnabled, setSwitchEnabled] = useState(false);
  const [switch2Enabled, setSwitch2Enabled] = useState(false);
  const [switch3Enabled, setSwitch3Enabled] = useState(false);
  const form2 = useForm();
  const form3 = useForm();
  const form4 = useForm<{
    tieredKey: RadioGroupTieredValue;
    tableFormItemCorrect: TFormTableItem<{ name: string }>;
    something: any;
  }>({ mode: 'onChange' });
  const form5 = useForm();

  const tagInputOptions: TagInputOption[] = [
    { label: 'Another option 1', value: 'something_1', type: 'predefined' },
    { label: 'something else option 2', value: 'something_2', type: 'predefined' },
    { label: 'yea option 3', value: 'something_3', type: 'predefined' },
    { label: 'no option 4', value: 'something_4', type: 'predefined' },
  ];
  const [step, setStep] = useState(0);

  /**
   * Create the button sets for displaying them on this page programmatically.
   */
  const buttonSet: { variant: ButtonVariant; sizes: ButtonSize[] }[] = [
    { variant: 'primary', sizes: ['lg', 'default', 'sm'] },
    { variant: 'secondary', sizes: ['lg', 'default', 'sm'] },
    { variant: 'tertiary', sizes: ['lg', 'default', 'sm'] },
    { variant: 'quaternary', sizes: ['lg', 'default', 'sm'] },
  ];
  return (
    <>
      <div>
        Icon components
        <Icon name={'x'} size={'lg'} />
      </div>
      <Container>
        <TagInput options={tagInputOptions} inputLabel="Form Label" id="" />
        <TagInput options={tagInputOptions} creatable inputLabel="Form Label" id="" />
      </Container>
      <Container>
        <FormV2 form={form5} onSubmit={() => {}}>
          <FormTagInputItem
            inputLabel="inside form"
            form={form5}
            id="tag-input"
            options={tagInputOptions}
            // disabled
          />
        </FormV2>
      </Container>
      <div className="w-128 p-8">
        <FormV2
          form={form4}
          onSubmit={(data) => {
            toaster.info({
              title: 'Form submitted',
              message: JSON.stringify(data),
              options: { duration: 10000 },
            });
          }}
        >
          <FormV2.FormRadioGroupTired
            form={form4}
            id={'tieredKey'}
            label={radioGroupTiered.label}
            options={radioGroupTiered.options}
          />
          <FormV2.RadioTableItem
            form={form4}
            id="something"
            columns={radioGroupTable2.columns}
            rows={radioGroupTable2.rows}
          />
          <FormV2.TableFormItem
            form={form4}
            id="tableFormItemCorrect"
            label={''}
            onNoEntriesText={'no entries'}
            renderEntry={(entry) => <div>entry</div>}
            onAddEntry={function (onAddEntryComplete: OnAddEntryFn<unknown>): void {
              throw new Error('Function not implemented.');
            }}
          />
          <Button type="submit">Submit</Button>
        </FormV2>
      </div>
      <div className="w-128 p-4">
        <Thread comments={mockComments} />
      </div>
      <Container className="border-b-2 flex flex-col gap-y-8">
        <StepBar
          className="w-full h-96"
          steps={[
            'Basics',
            'Typical diet',
            'Treatment plan',
            'Foodsmart goals',
            'Notes & resources',
            'Follow-up',
          ]}
          curStep={step}
          onClick={setStep}
        />
        <Section title="Button component" subtitle="Here is my subtitle" divider={true}>
          <table className={'mb-8'}>
            <caption className={'heading-xs text-left'}>Default Theme</caption>
            <thead>
              <tr>
                <th className="text-left border-r px-4 border-b w-20">Variant</th>
                <th className="px-4 border-b">Small</th>
                <th className="px-4 border-b">Default</th>
                <th className="px-4 border-b">Large</th>
              </tr>
            </thead>
            <tbody>
              {buttonSet.map((button) => (
                <tr key={button.variant}>
                  <th className="text-left border-r px-4 py-2">{button.variant}</th>
                  {button.sizes.map((size) => (
                    <td key={button.variant + size} className="px-4 py-2" align={'center'}>
                      <Button
                        leftIcon={{ name: 'placeholder' }}
                        variant={button.variant}
                        size={size}
                      >
                        Button
                      </Button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <table>
            <caption className={'heading-xs text-left'}>Destructive Theme</caption>
            <thead>
              <tr>
                <th className="text-left border-r px-4 border-b w-20">Variant</th>
                <th className="px-4 border-b">Small</th>
                <th className="px-4 border-b">Default</th>
                <th className="px-4 border-b">Large</th>
              </tr>
            </thead>
            <tbody>
              {buttonSet.map((button) => (
                <tr key={button.variant}>
                  <th className="text-left border-r px-4 py-2">{button.variant}</th>
                  {button.sizes.map((size) => (
                    <td key={button.variant + size} className="px-4 py-2" align={'center'}>
                      <Button
                        leftIcon={{ name: 'placeholder' }}
                        theme={'destructive'}
                        variant={button.variant}
                        size={size}
                      >
                        Button
                      </Button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
        <Section title="Icon button component" subtitle="" divider={true}>
          <table className={'mb-8'}>
            <caption className={'heading-xs text-left'}>Default Theme</caption>
            <thead>
              <tr>
                <th className="text-left border-r px-4 border-b w-20">Variant</th>
                <th className="px-4 border-b">Small</th>
                <th className="px-4 border-b">Default</th>
                <th className="px-4 border-b">Large</th>
              </tr>
            </thead>
            <tbody>
              {buttonSet.map((button) => (
                <tr key={button.variant}>
                  <th className="text-left border-r px-4 py-2">{button.variant}</th>
                  {button.sizes.map((size) => (
                    <td key={button.variant + size} className="px-4 py-2" align={'center'}>
                      <IconButton iconName={'placeholder'} variant={button.variant} size={size} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <table>
            <caption className={'heading-xs text-left'}>Destructive Theme</caption>
            <thead>
              <tr>
                <th className="text-left border-r px-4 border-b w-20">Variant</th>
                <th className="px-4 border-b">Small</th>
                <th className="px-4 border-b">Default</th>
                <th className="px-4 border-b">Large</th>
              </tr>
            </thead>
            <tbody>
              {buttonSet.map((button) => (
                <tr key={button.variant}>
                  <th className="text-left border-r px-4 py-2">{button.variant}</th>
                  {button.sizes.map((size) => (
                    <td key={button.variant + size} className="px-4 py-2" align={'center'}>
                      <IconButton
                        iconName={'placeholder'}
                        theme={'destructive'}
                        variant={button.variant}
                        size={size}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
        <Section
          title="Split Buttons"
          subtitle="Should only ever have a primary button and dropdown target"
          divider={true}
        >
          <SplitButton variant="primary" size="default" theme="primary">
            <SplitButtonItem>First</SplitButtonItem>
            <SplitButtonItem>
              <Icon name="meatballs" size="lg" />
            </SplitButtonItem>
          </SplitButton>
          <SplitButton variant="primary" size="default" theme="destructive">
            <SplitButtonItem>First</SplitButtonItem>
            <SplitButtonItem>
              <Icon name="meatballs" size="lg" />
            </SplitButtonItem>
          </SplitButton>
          <SplitButton variant="primary" size="sm" theme="primary">
            <SplitButtonItem>First</SplitButtonItem>
            <SplitButtonItem>
              <Icon name="meatballs" />
            </SplitButtonItem>
          </SplitButton>
          <SplitButton variant="primary" size="sm" theme="destructive">
            <SplitButtonItem>First</SplitButtonItem>
            <SplitButtonItem>
              <Icon name="meatballs" />
            </SplitButtonItem>
          </SplitButton>
          <SplitButton variant="secondary" size="default" theme="destructive">
            <SplitButtonItem>First</SplitButtonItem>
            <SplitButtonItem>
              <Icon name="meatballs" />
            </SplitButtonItem>
          </SplitButton>
          <SplitButton variant="secondary" size="default" theme="primary">
            <SplitButtonItem>First</SplitButtonItem>
            <SplitButtonItem>
              <Icon name="meatballs" />
            </SplitButtonItem>
          </SplitButton>
          <SplitButton variant="primary" size="lg" theme="destructive">
            <SplitButtonItem variant="tertiary">First</SplitButtonItem>
            <SplitButtonItem>
              <Icon name="meatballs" />
            </SplitButtonItem>
          </SplitButton>
        </Section>

        <section></section>

        <div>
          Link
          <div>
            <LinkButton onClick={() => {}}>Link</LinkButton>
            <LinkButton onClick={() => {}} size="sm">
              Link
            </LinkButton>
          </div>
        </div>
      </Container>
      <Container className="border-b-2 flex flex-col gap-y-8">
        <div>
          <h1>Toggle</h1>
          <div className="flex items-center space-x-2">
            <Toggle
              title="This is the title for the toggle"
              description="This is a description for this toggle thingy"
              enabled={switchEnabled}
              setEnabled={() => setSwitchEnabled((e) => !e)}
            />
          </div>
          <Toggle
            disabled
            title="Disabled Toggle"
            description="Some description"
            enabled={switch2Enabled}
            setEnabled={() => setSwitch2Enabled((e) => !e)}
          />
          <h2>Button Toggle</h2>
        </div>
      </Container>
      <Container className="border-b-2 flex flex-col gap-y-8">
        <div>
          <h1 className={'heading-m'}>Modal</h1>
          <div className="grid md:grid-cols-3 grid-cols-2 gap-y-2 gap-x-2">
            <Button
              variant="primary"
              onClick={() => {
                modal.openPrimary({
                  type: 'basic',
                  title: 'Basic Modal',
                  showCloseButton: true,
                  body: <SlotPlaceholder />,
                  footer: (
                    <ButtonBar>
                      <ButtonBar.Group>
                        <Button variant="tertiary">Back</Button>
                      </ButtonBar.Group>
                      <ButtonBar.Group>
                        <Button variant="secondary">Cancel</Button>
                        <Button variant="primary">Ok</Button>
                      </ButtonBar.Group>
                    </ButtonBar>
                  ),
                });
              }}
            >
              Open Basic Modal with footer
            </Button>
            <Button
              variant={'secondary'}
              onClick={() =>
                modal.openPrimary({
                  type: 'dialog',
                  title: 'Some Dialog',
                  body: 'Some body',
                  showCloseButton: true,
                  icon: { name: 'alert-triangle' },
                  footer: (
                    // This is an option for mobile vs desktop...
                    <>
                      <ButtonBar className="hidden md:flex">
                        <ButtonBar.Group>
                          <Button variant="tertiary">Back</Button>
                        </ButtonBar.Group>
                        <ButtonBar.Group>
                          <Button variant="secondary">Cancel</Button>
                          <Button variant="primary">Ok</Button>
                        </ButtonBar.Group>
                      </ButtonBar>
                      <ButtonBar className="flex md:hidden gap-x-2">
                        <Button className="flex-1" variant="secondary">
                          Cancel
                        </Button>
                        <Button className="flex-1" variant="primary">
                          Ok
                        </Button>
                      </ButtonBar>
                    </>
                  ),
                })
              }
            >
              Open Dialog
            </Button>
            <Button
              variant={'secondary'}
              theme={'destructive'}
              onClick={() =>
                modal.openPrimary({
                  type: 'dialog',
                  title: 'Some Dialog',
                  body: 'Some body',
                  theme: 'destructive',
                  icon: { name: 'alert-triangle' },
                  footer: (
                    <ButtonBar>
                      <ButtonBar.Group>
                        <Button theme="destructive" variant="tertiary">
                          Back
                        </Button>
                      </ButtonBar.Group>
                      <ButtonBar.Group>
                        <Button
                          theme="destructive"
                          variant="secondary"
                          onClick={() => modal.closeAll()}
                        >
                          Cancel
                        </Button>
                        <Button theme="destructive" variant="primary">
                          Ok
                        </Button>
                      </ButtonBar.Group>
                    </ButtonBar>
                  ),
                })
              }
            >
              Open Dialog Destructive
            </Button>
          </div>
        </div>
      </Container>
      <Container>
        <div className="flex flex-col gap-y-4">
          <h1>Alert Bars</h1>
          <Banner
            banner={{
              type: 'warn',
              size: 'large',
              message: 'This is an Alert',
              description: 'Smaller alert description',
              action: {
                title: 'Should Close',
                onClick: () => {},
              },
            }}
          />
          <Banner
            banner={{
              type: 'primary',
              size: 'large',
              message: 'This is an Alert',
              description: 'Smaller alert description',
              action: {
                title: 'Should Close',
                onClick: () => {},
              },
            }}
          />
          <Banner
            banner={{
              type: 'info',
              size: 'large',
              message: 'This is an Alert',
              description: 'Smaller alert description',
              action: {
                title: 'Should Close',
                onClick: () => {},
              },
            }}
          />
          <Banner
            banner={{
              type: 'destructive',
              size: 'large',
              message: 'This is an Alert',
              description: 'Smaller alert description',
              action: {
                title: 'Should Close',
                onClick: () => {},
              },
            }}
          />
          <Banner
            banner={{
              type: 'warn',
              size: 'small',
              message: 'This is an Alert',
              description:
                'In blandit facilisis lacus. Curabitur porta laoreet tempus. Phasellus sagittis id enim dapibus posuere. Morbi eu libero auctor, aliquam justo sed, posuere leo.',
              action: {
                title: 'Should Close',
                onClick: () => {},
              },
            }}
          />
          <Banner
            banner={{
              type: 'primary',
              size: 'small',
              message: 'This is an Alert',
              description: 'Smaller alert description',
            }}
          />
          <Banner
            banner={{
              type: 'info',
              size: 'small',
              message: 'This is an Alert',
              description: 'Smaller alert description',
            }}
          />
          <Banner
            banner={{
              type: 'destructive',
              size: 'small',
              message: 'This is an Alert',
              description: 'Smaller alert description',
            }}
          />
        </div>
      </Container>
      <Container>
        <h1>Dropdown</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Team</DropdownMenuItem>
            <DropdownMenuItem>Subscription</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Container>
      <Container>
        <h1 className="heading-m">Badges</h1>
        <h2 className="heading-s">Status</h2>
        <div className="flex gap-x-4 overflow-y-scroll">
          {/* <Badge LeftIcon={'dot'}>Default</Badge>
            <Badge LeftIcon={'dot'} variant={'statusRed'}>
              statusRed
            </Badge>
            <Badge LeftIcon={'dot'} variant={'statusAmber'}>
              statusAmber
            </Badge>
            <Badge LeftIcon={'dot'} variant={'statusGreen'}>
              statusGreen
            </Badge>
            <Badge LeftIcon={Calendar} variant={'blue'}>
              Blue
            </Badge> */}
        </div>
        <h2 className="heading-s">Icon Badge</h2>
        <div className="flex gap-x-4 mt-4 overflow-y-scroll">
          {/* <Badge LeftIcon={Calendar} variant={'teal'}>
              Teal
            </Badge>
            <Badge LeftIcon={Calendar} variant={'purple'}>
              Blue
            </Badge>
            <Badge LeftIcon={Calendar} variant={'orange'}>
              Blue
            </Badge>
            <Badge LeftIcon={Calendar} variant={'paleGreen'}>
              paleGreen
            </Badge>
            <Badge LeftIcon={Calendar} variant={'clear'}>
              clear
            </Badge>
            <Badge LeftIcon={Calendar}>Calendar</Badge> */}
        </div>
        <h2 className="heading-s">Tag Badge</h2>
        <div className="flex gap-x-4 mt-4 overflow-y-scroll">
          <Badge variant={'teal'}>Teal</Badge>
          <Badge variant={'purple'}>Blue</Badge>
          <Badge variant={'orange'}>Blue</Badge>
          <Badge variant={'paleGreen'}>paleGreen</Badge>
          <Badge variant={'clear'}>clear</Badge>
          <Badge>Calendar</Badge>
        </div>
      </Container>
      <Container>
        <h1>Toaster!</h1>
        <Button
          onClick={() =>
            toaster.success({
              title: 'Time slot has been blocked',
              message:
                'October 12, at 9:00am has been blocked. You will not be scheduled for sessions at this time.',
            })
          }
        >
          Success Toast!
        </Button>
        <Button
          onClick={() => {
            toaster.fail({
              title: 'This has been a failure!',
              message:
                "Something terrible went wrong, but we arens't really sure what happened... oops",
            });
          }}
        >
          Fail Toast!
        </Button>

        <Button
          onClick={() => {
            toaster.warn({
              title: 'This has been a WARNING',
              message:
                "Something terrible went wrong, but we arens't really sure what happened... oops",
            });
          }}
        >
          Warn Toast!
        </Button>
        <Button
          onClick={() => {
            toaster.info({
              title: 'This has been a INFO INFO',
              message:
                "Something terrible went wrong, but we arens't really sure what happened... oops",
            });
          }}
        >
          Info Toast!
        </Button>
      </Container>
      <Container>
        <h1>Drawer</h1>
        <Button onClick={() => drawer.openDrawer({ type: 'example' })}>Open Drawer</Button>
      </Container>
      <Container>
        <h1>Radio Group</h1>
        <Columns cols={2}>
          <FormV2 form={form2} onSubmit={() => {}}>
            <Container>
              <h3>Group as Cards</h3>
              {/* TODO: Needs a "disallowed" variant */}
              <RadioGroup form={form2} id="first_group">
                <RadioGroupItemCard value="1" description="Hello world!! 1" title="This is 1" />
                <RadioGroupItemCard value="2" description="Hello world!! 2" title="This is 2" />
                <RadioGroupItemCard value="3" description="Hello world!! 3" title="This is 3" />
              </RadioGroup>
            </Container>
            <Container>
              <h3>Group as Default</h3>
              <RadioGroup form={form2} id="second_group">
                <RadioGroupItemDefault value="1" description="Hello world!! 1" title="This is 1" />
                <RadioGroupItemDefault value="2" description="Hello world!! 2" title="This is 2" />
                <RadioGroupItemDefault value="3" description="Hello world!! 3" title="This is 3" />
              </RadioGroup>
            </Container>
          </FormV2>
        </Columns>
      </Container>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <Container className="flex flex-col gap-y-2">
          <h1>Accordion</h1>
          <AccordionItem header={'Some header'} icons={<Badge>2 Modules Billed</Badge>} />
          <AccordionItem header={'Some header'} icons={<Badge>2 Modules Billed</Badge>} />
          <AccordionItem header={'Some header'} icons={<Badge>2 Modules Billed</Badge>} />
        </Container>
      </div>
      <Container>
        <h1>Rich Text</h1>
        {/* <RichText /> */}
      </Container>
      <Container>
        <h3>Forms</h3>
        <FormV2
          form={form}
          className="grid grid-cols-1 gap-4 gap-y-6 sm:grid-cols-2 md:grid-cols-5 px-4"
          onSubmit={(values) => {
            console.log('values', values);
          }}
        >
          <FormItem
            form={form}
            className="md:col-span-2"
            id="firstName"
            label="First Name"
            rules={{ required: true }}
            renderItem={(field) => <BaseInput {...field} />}
          />
          <FormDatePickerItem form={form} id="date" inputLabel="date" />
          <FormItem
            form={form}
            className="md:col-span-2"
            label="Last Name"
            id="lastName"
            rules={{ required: true }}
            renderItem={(field) => <BaseInput {...field} />}
          />
          <FormItem
            form={form}
            className="md:col-span-1"
            label="Sex"
            id="sex"
            rules={{ required: true }}
            renderItem={(field) => <BaseInput {...field} />}
          />
          <FormItem
            form={form}
            className="md:col-span-2"
            id="birthday"
            label="Birthday"
            description="hello world"
            renderItem={(field) => <BaseInput {...field} />}
          />
          <FormItem
            form={form}
            className="md:col-span-2"
            label="Phone Number"
            id="phone"
            description="hello world"
            renderItem={(field) => <BaseInput {...field} />}
          />
          <FormItem
            form={form}
            className="md:col-span-2"
            label="Other value"
            id="phone"
            description="hello world"
            renderItem={(field) => <BaseInput {...field} />}
          />
          <SelectFormItem
            form={form}
            placeholder="Choose an email"
            className="md:col-span-2"
            id="select-1"
            rules={{ required: true }}
            label="Email"
            options={[
              { value: 'first', label: 'first@gmail.com' },
              { value: 'second', label: 'second@gmail.com' },
              { value: 'third', label: 'third@gmail.com' },
            ]}
          />
          <Button type="submit" variant={'primary'}>
            Submit
          </Button>
        </FormV2>
      </Container>
      <Container>
        <h4>Editable Content</h4>
        <div className="w-96">
          <EditableValue label="Some label" value="Default value" onSave={() => {}} />
          <EditableValue label="Some label" value="Default value" onSave={() => {}} />
          <EditableValue label="Some label" value="Default value" onSave={() => {}} />
          <EditableValue label="Some label" value="Default value" onSave={() => {}} />
          <EditableValue label="Some label" value="Default value" onSave={() => {}} />
        </div>
      </Container>
      <Container>
        Checkbox
        <FormV2
          form={form3}
          onSubmit={(v) => {
            console.log('VAL', v);
          }}
        >
          <CheckBox
            form={form3}
            label="This is a label"
            description="Some descriptoin..."
            id="checkbox"
          />
          <FormV2.FormButtonToggle
            form={form3}
            id="toggle"
            options={[
              { name: 'First', iconName: 'calendar', value: 1 },
              { name: 'Second', iconName: 'arrow-right', value: 2 },
              { name: 'Third', value: 3 },
              { name: 'Fourth', iconName: 'alert', value: 4 },
            ]}
          />
          <Button type="submit">Submit</Button>
        </FormV2>
      </Container>
      <Container>
        <TimelineVertical
          entries={[
            {
              key: '1',
              content: (
                <div className="flex flex-col gap-y-2">
                  <div className="flex flex-row items-center text-sm">
                    <span className="w-[75px]">Units</span>
                    <span>125</span>
                  </div>
                  <div className="flex flex-row items-center text-sm">
                    <span className="text-sm w-[75px]">Units</span>
                    <span>125</span>
                  </div>
                  <div className="flex flex-row items-center text-sm">
                    <span className="text-sm w-[75px]">Units</span>
                    <span>125</span>
                  </div>
                </div>
              ),
            },
            {
              key: '2',
              content: (
                <div className="flex flex-col gap-y-2">
                  <div className="flex flex-row items-center text-sm">
                    <span className="w-[75px]">Units</span>
                    <span>125</span>
                  </div>
                  <div className="flex flex-row items-center text-sm">
                    <span className="text-sm w-[75px]">Units</span>
                    <span>125</span>
                  </div>
                  <div className="flex flex-row items-center text-sm">
                    <span className="text-sm w-[75px]">Units</span>
                    <span>125</span>
                  </div>
                </div>
              ),
            },
            {
              key: '3',
              content: (
                <div className="flex flex-col gap-y-2">
                  <div className="flex flex-row items-center text-sm">
                    <span className="w-[75px]">Units</span>
                    <span>125</span>
                  </div>
                  <div className="flex flex-row items-center text-sm">
                    <span className="text-sm w-[75px]">Units</span>
                    <span>125</span>
                  </div>
                  <div className="flex flex-row items-center text-sm">
                    <span className="text-sm w-[75px]">Units</span>
                    <span>125</span>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Container>
      <div className="h-96" />
    </>
  );
}
